import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const accounts = await sql`
      SELECT ba.*
      FROM bank_accounts ba
      JOIN fleet_banks fb ON ba.bank_id = fb.id
      JOIN fleets f ON fb.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE ba.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (accounts.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const account = accounts[0]

    const result = await sql`
      INSERT INTO bank_accounts (
        bank_id, account_name, account_number, currency, iban, account_type, is_active, notes
      ) VALUES (
        ${account.bank_id},
        ${account.account_name + " - Kopya"},
        ${account.account_number + "-COPY"},
        ${account.currency},
        ${account.iban},
        ${account.account_type},
        ${account.is_active},
        ${account.notes}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Copy account error:", error)
    return NextResponse.json({ error: "Failed to copy account" }, { status: 500 })
  }
}
