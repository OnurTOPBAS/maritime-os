import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"


/**
 * Updates bank balance based on income/expense transaction
 * Called after creating or updating an office PnL record
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    // Bakiye güncellemesi paylaşılan mali veriyi değiştirir.
    await requireSystemAdmin(user.id)

    const body = await request.json()
    const { recordId } = body

    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 })
    }

    // Get the record details
    const records = await sql`
      SELECT * FROM office_pnl WHERE id = ${recordId}
    `

    if (records.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    const record = records[0]

    // Only update if payment is made (paid status) and has bank/payee bank and report month
    if (record.payment_status !== "paid" || !record.payee_bank_id || !record.report_month) {
      return NextResponse.json({ 
        message: "No balance update needed",
        reason: "Payment not completed or missing bank/month"
      })
    }

    const bankId = record.payee_bank_id
    const reportMonth = record.report_month
    const amountUsd = Number.parseFloat(record.price_usd) || 0
    const amountTl = Number.parseFloat(record.price_tl) || 0
    const isIncome = record.type === "income"

    // Calculate the change (positive for income, negative for expense)
    const changeUsd = isIncome ? amountUsd : -amountUsd
    const changeTl = isIncome ? amountTl : -amountTl

    // Check if balance record exists for this bank and month
    const existingBalance = await sql`
      SELECT * FROM office_bank_balances
      WHERE bank_id = ${bankId} AND report_month = ${reportMonth}
    `

    if (existingBalance.length > 0) {
      // Update existing balance
      const currentBalanceUsd = Number.parseFloat(existingBalance[0].balance_usd) || 0
      const currentBalanceTl = Number.parseFloat(existingBalance[0].balance_tl) || 0

      await sql`
        UPDATE office_bank_balances
        SET balance_usd = ${currentBalanceUsd + changeUsd},
            balance_tl = ${currentBalanceTl + changeTl},
            closing_balance_usd = ${currentBalanceUsd + changeUsd},
            closing_balance_tl = ${currentBalanceTl + changeTl},
            updated_by = ${user.id},
            updated_at = NOW()
        WHERE bank_id = ${bankId} AND report_month = ${reportMonth}
      `
    } else {
      // Get bank name
      const bank = await sql`SELECT name FROM office_payee_banks WHERE id = ${bankId}`
      const bankName = bank[0]?.name || null

      // Create new balance record (starting from 0 + change)
      await sql`
        INSERT INTO office_bank_balances (
          bank_id, bank_name, report_month,
          balance_usd, balance_tl,
          closing_balance_usd, closing_balance_tl,
          created_by
        ) VALUES (
          ${bankId}, ${bankName}, ${reportMonth},
          ${changeUsd}, ${changeTl},
          ${changeUsd}, ${changeTl},
          ${user.id}
        )
      `
    }

    // Now carry forward to next months
    await carryForwardBalances(bankId, reportMonth)

    return NextResponse.json({ 
      success: true,
      message: "Balance updated successfully",
      bankId,
      reportMonth,
      changeUsd,
      changeTl
    })

  } catch (error) {
    return handleApiError(error, "Error updating bank balance:")
  }
}

/**
 * Carry forward closing balance to subsequent months
 */
async function carryForwardBalances(bankId: string, fromMonth: string) {
  try {
    // Get current month's closing balance
    const currentBalance = await sql`
      SELECT closing_balance_usd, closing_balance_tl
      FROM office_bank_balances
      WHERE bank_id = ${bankId} AND report_month = ${fromMonth}
    `

    if (currentBalance.length === 0) return

    const closingUsd = Number.parseFloat(currentBalance[0].closing_balance_usd) || 0
    const closingTl = Number.parseFloat(currentBalance[0].closing_balance_tl) || 0

    // Get the next month
    const [year, month] = fromMonth.split("-").map(Number)
    const nextDate = new Date(year, month, 1) // month is 0-indexed, so this gets next month
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`

    // Check if next month balance exists
    const nextMonthBalance = await sql`
      SELECT id FROM office_bank_balances
      WHERE bank_id = ${bankId} AND report_month = ${nextMonth}
    `

    if (nextMonthBalance.length > 0) {
      // Update opening balance for next month
      await sql`
        UPDATE office_bank_balances
        SET opening_balance_usd = ${closingUsd},
            opening_balance_tl = ${closingTl}
        WHERE bank_id = ${bankId} AND report_month = ${nextMonth}
      `

      // Recursively carry forward
      await carryForwardBalances(bankId, nextMonth)
    }
  } catch (error) {
    console.error("Error carrying forward balances:", error)
  }
}
