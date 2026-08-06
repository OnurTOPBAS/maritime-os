import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"


export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const reportMonth = searchParams.get("reportMonth")

    if (reportMonth) {
      const balances = await sql`
        SELECT bb.*, pb.name as bank_name_ref
        FROM office_bank_balances bb
        LEFT JOIN office_payee_banks pb ON bb.bank_id = pb.id
        WHERE bb.report_month = ${reportMonth}
        ORDER BY COALESCE(pb.name, bb.bank_name) ASC
      `
      return NextResponse.json(balances)
    }

    // Tüm bankalar. Not: office_payee_banks tablosunda is_active sütunu yok;
    // önceki kod olmayan bir sütunu filtrelediği için sorgu her istekte hata
    // veriyordu.
    const banks = await sql`
      SELECT * FROM office_payee_banks ORDER BY name ASC
    `
    return NextResponse.json(banks)
  } catch (error) {
    // İç hata mesajı istemciye sızdırılmaz.
    return handleApiError(error, "Banka bakiyeleri")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    // Banka bakiyeleri tüm şirketleri etkileyen paylaşılan mali veridir.
    await requireSystemAdmin(user.id)

    const body = await request.json()
    const { bankId, bankName, reportMonth, balanceTl, balanceUsd, currencyRate, notes } = body

    if (!reportMonth) {
      return NextResponse.json({ error: "reportMonth is required" }, { status: 400 })
    }

    if (!bankId) {
      return NextResponse.json({ error: "bankId is required" }, { status: 400 })
    }

    // Check if balance already exists for this bank and month
    const existing = await sql`
      SELECT id FROM office_bank_balances 
      WHERE bank_id = ${bankId} AND report_month = ${reportMonth}
    `

    if (existing.length > 0) {
      // Update existing balance
      const result = await sql`
        UPDATE office_bank_balances
        SET closing_balance_tl = ${balanceTl || 0}, 
            closing_balance_usd = ${balanceUsd || 0},
            balance_tl = ${balanceTl || 0},
            balance_usd = ${balanceUsd || 0},
            currency_rate = ${currencyRate || null},
            notes = ${notes || null},
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
        closing_balance_tl, closing_balance_usd,
        balance_tl, balance_usd,
        currency_rate, notes, created_by
      ) VALUES (
        ${bankId}, ${bankName || null}, ${reportMonth}, 
        ${balanceTl || 0}, ${balanceUsd || 0},
        ${balanceTl || 0}, ${balanceUsd || 0},
        ${currencyRate || null}, ${notes || null}, ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Banka bakiyesi kaydetme")
  }
}
