import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin, getAccessibleCompanyIds, isSuperAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { computeOpening, computeClosing } from "@/lib/office-balances"

/*
 * Banka / kasa bakiyeleri HESAPLANAN modeldir (bkz. lib/office-balances):
 *   Açılış  = o ay elle girilen başlangıç varsa o, yoksa önceki ayın kapanışı.
 *   Kapanış = Açılış + o ay o bankadan yapılan ÖDENMİŞ gelir/giderlerin neti.
 * Böylece kalan para sonraki aya devreder ve ödenen gider otomatik düşer.
 */

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const reportMonth = searchParams.get("reportMonth")

    // Yetkisi olmayan kullanıcı (hiçbir şirkete üye değil) kasa/bakiye görmez.
    const superAdmin = await isSuperAdmin(user.id)
    const allowed = await getAccessibleCompanyIds(user.id)
    if (!superAdmin && allowed.length === 0) {
      return NextResponse.json([])
    }

    if (reportMonth) {
      // Gösterilecek bankalar: herhangi bir ayda elle bakiyesi olanlar VEYA
      // bu ay işlem yapılmış olanlar.
      const banks = await sql`
        SELECT DISTINCT b.id, b.name
        FROM office_payee_banks b
        WHERE b.id IN (SELECT bank_id FROM office_bank_balances)
           OR b.id IN (
             SELECT payee_bank_id FROM office_pnl
             WHERE report_month = ${reportMonth} AND payee_bank_id IS NOT NULL
           )
        ORDER BY b.name ASC
      `

      const result = []
      for (const b of banks) {
        const opening = await computeOpening(b.id, reportMonth)
        const closing = await computeClosing(b.id, reportMonth)
        result.push({
          bank_id: b.id,
          bank_name: b.name,
          report_month: reportMonth,
          opening_balance_usd: opening.usd,
          opening_balance_tl: opening.tl,
          opening_balance_aed: opening.aed,
          // net = kapanış - açılış
          net_usd: closing.usd - opening.usd,
          net_tl: closing.tl - opening.tl,
          // Kapanış (kalan). Export ve arayüz bu alanları okur.
          closing_balance_usd: closing.usd,
          closing_balance_tl: closing.tl,
          closing_balance_aed: closing.aed,
          balance_usd: closing.usd,
          balance_tl: closing.tl,
        })
      }
      return NextResponse.json(result)
    }

    const banks = await sql`SELECT * FROM office_payee_banks ORDER BY name ASC`
    return NextResponse.json(banks)
  } catch (error) {
    return handleApiError(error, "Banka bakiyeleri")
  }
}

/**
 * Bir bankanın bir ay için AÇILIŞ (başlangıç) bakiyesini elle belirler.
 * Genelde yalnızca takibe başlanan ilk ay için girilir; sonraki aylar
 * otomatik devreder. Sonraki ay için tekrar girilirse devri ezer.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    await requireSystemAdmin(user.id)

    const body = await request.json()
    const { bankId, bankName, reportMonth } = body
    // Yeni alan adları: openingTl/Usd/Aed. Eski istemciyle uyum için balance* de kabul.
    const openingTl = body.openingTl ?? body.balanceTl ?? 0
    const openingUsd = body.openingUsd ?? body.balanceUsd ?? 0
    const openingAed = body.openingAed ?? body.balanceAed ?? 0

    if (!reportMonth) return NextResponse.json({ error: "reportMonth is required" }, { status: 400 })
    if (!bankId) return NextResponse.json({ error: "bankId is required" }, { status: 400 })

    const existing = await sql`
      SELECT id FROM office_bank_balances WHERE bank_id = ${bankId} AND report_month = ${reportMonth}
    `

    if (existing.length > 0) {
      const result = await sql`
        UPDATE office_bank_balances
        SET opening_balance_tl = ${openingTl || 0},
            opening_balance_usd = ${openingUsd || 0},
            opening_balance_aed = ${openingAed || 0},
            updated_by = ${user.id},
            updated_at = NOW()
        WHERE bank_id = ${bankId} AND report_month = ${reportMonth}
        RETURNING *
      `
      return NextResponse.json(result[0])
    }

    const result = await sql`
      INSERT INTO office_bank_balances (
        bank_id, bank_name, report_month,
        opening_balance_tl, opening_balance_usd, opening_balance_aed, created_by
      ) VALUES (
        ${bankId}, ${bankName || null}, ${reportMonth},
        ${openingTl || 0}, ${openingUsd || 0}, ${openingAed || 0}, ${user.id}
      )
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Banka bakiyesi kaydetme")
  }
}
