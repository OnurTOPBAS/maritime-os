import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Get bank with access check
    const banks = await sql`
      SELECT fb.*
      FROM fleet_banks fb
      JOIN fleets f ON fb.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE fb.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (banks.length === 0) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    const bank = banks[0]

    // Create copy
    const result = await sql`
      INSERT INTO fleet_banks (
        fleet_id, bank_name, bank_code, swift_code, branch_name, branch_address,
        relationship_manager_name, relationship_manager_email, relationship_manager_phone, notes
      )
      VALUES (
        ${bank.fleet_id}, 
        ${bank.bank_name + " - COPY"}, 
        ${bank.bank_code}, 
        ${bank.swift_code}, 
        ${bank.branch_name}, 
        ${bank.branch_address},
        ${bank.relationship_manager_name}, 
        ${bank.relationship_manager_email}, 
        ${bank.relationship_manager_phone}, 
        ${bank.notes}
      )
      RETURNING *
    `

    // Copy accounts
    const accounts = await sql`
      SELECT * FROM bank_accounts WHERE bank_id = ${id}
    `

    for (const account of accounts) {
      await sql`
        INSERT INTO bank_accounts (
          bank_id, account_name, account_number, currency, iban, account_type, is_active, notes
        )
        VALUES (
          ${result[0].id}, ${account.account_name}, ${account.account_number}, ${account.currency},
          ${account.iban}, ${account.account_type}, ${account.is_active}, ${account.notes}
        )
      `
    }

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Copy bank error:", error)
    return NextResponse.json({ error: "Failed to copy bank" }, { status: 500 })
  }
}
