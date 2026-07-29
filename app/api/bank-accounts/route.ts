import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { bankId, accountName, accountNumber, currency, iban, accountType, isActive, notes } = body

    if (!bankId || !accountName || !accountNumber) {
      return NextResponse.json({ error: "Bank ID, account name, and account number are required" }, { status: 400 })
    }

    // Check if user has access to this bank
    const bankAccess = await sql`
      SELECT fb.id
      FROM fleet_banks fb
      JOIN fleets f ON fb.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE fb.id = ${bankId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (bankAccess.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const result = await sql`
      INSERT INTO bank_accounts (
        bank_id, account_name, account_number, currency, iban, account_type, is_active, notes
      )
      VALUES (
        ${bankId}, ${accountName}, ${accountNumber}, ${currency || "USD"}, ${iban || null}, 
        ${accountType || null}, ${isActive !== false}, ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Create account error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
