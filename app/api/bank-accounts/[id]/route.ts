import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Check access
    const accounts = await sql`
      SELECT ba.id
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

    const result = await sql`
      UPDATE bank_accounts
      SET 
        account_name = ${body.accountName},
        account_number = ${body.accountNumber},
        currency = ${body.currency || "USD"},
        iban = ${body.iban || null},
        account_type = ${body.accountType || null},
        is_active = ${body.isActive !== false},
        notes = ${body.notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update account error:", error)
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Check access
    const accounts = await sql`
      SELECT ba.id
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

    await sql`DELETE FROM bank_accounts WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete account error:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
