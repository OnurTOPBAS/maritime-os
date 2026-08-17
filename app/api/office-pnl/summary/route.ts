import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"
import { computeTotalKasa } from "@/lib/office-balances"
import { getAccessibleCompanyIds, isSuperAdmin } from "@/lib/authz"

/**
 * Office PnL özeti: tüm şirketler birlikte.
 *  - Toplam Kasa: tüm bankaların seçili ay sonundaki kalanı (kümülatif, USD/TL).
 *  - Bu Ay Gelir / Gider / Net: seçili ayda tüm şirketlerin toplamı (USD/TL).
 *
 * Ay toplamları o ay GİRİLEN tüm kayıtları sayar (ödenmiş/ödenmemiş fark etmez);
 * kasa ise yalnızca ödenenleri yansıtır (gerçekte cepten çıkan para).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("reportMonth") || new Date().toISOString().slice(0, 7)

    // Erişim sınırı: kullanıcı yalnızca erişebildiği şirketlerin (ve kendi
    // oluşturduğu şirketsiz kayıtların) toplamını görür. Süper yönetici hepsini.
    const superAdmin = await isSuperAdmin(user.id)
    const allowed = await getAccessibleCompanyIds(user.id)

    if (!superAdmin && allowed.length === 0) {
      // Hiçbir şirkete yetkisi yoksa boş özet (yeni üye PnL göremez).
      return NextResponse.json({
        month, kasaUsd: 0, kasaTl: 0, kasaAed: 0,
        incomeUsd: 0, expenseUsd: 0, netUsd: 0, incomeTl: 0, expenseTl: 0, netTl: 0,
      })
    }

    const [totals] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN price_usd ELSE 0 END), 0) AS income_usd,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN price_usd ELSE 0 END), 0) AS expense_usd,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN price_tl  ELSE 0 END), 0) AS income_tl,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN price_tl  ELSE 0 END), 0) AS expense_tl
      FROM office_pnl
      WHERE report_month = ${month}
        AND (
          ${superAdmin}
          OR company_id = ANY(${allowed}::uuid[])
          OR (company_id IS NULL AND created_by = ${user.id}::uuid)
        )
    `

    const kasa = await computeTotalKasa(month)

    const incomeUsd = Number(totals.income_usd) || 0
    const expenseUsd = Number(totals.expense_usd) || 0
    const incomeTl = Number(totals.income_tl) || 0
    const expenseTl = Number(totals.expense_tl) || 0

    return NextResponse.json({
      month,
      kasaUsd: kasa.usd,
      kasaTl: kasa.tl,
      kasaAed: kasa.aed,
      incomeUsd,
      expenseUsd,
      netUsd: incomeUsd - expenseUsd,
      incomeTl,
      expenseTl,
      netTl: incomeTl - expenseTl,
    })
  } catch (error) {
    return handleApiError(error, "Office PnL özeti")
  }
}
