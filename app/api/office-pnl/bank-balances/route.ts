import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Get all active banks
    const banks = await sql`
      SELECT * FROM office_payee_banks WHERE is_active = true ORDER BY name ASC
    `
    return NextResponse.json(banks)
  } catch (error: any) {
    console.error("Error fetching bank balances:", error.message)
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
            updated_by = ${session.id},
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
        ${currencyRate || null}, ${notes || null}, ${session.id}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error saving bank balance:", error.message)
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 })
  }
}
