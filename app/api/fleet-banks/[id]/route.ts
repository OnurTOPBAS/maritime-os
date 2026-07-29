import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get accounts for this bank
    const accounts = await sql`
      SELECT * FROM bank_accounts
      WHERE bank_id = ${id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ ...banks[0], accounts })
  } catch (error) {
    console.error("[v0] Get bank error:", error)
    return NextResponse.json({ error: "Failed to fetch bank" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Check access
    const banks = await sql`
      SELECT fb.id
      FROM fleet_banks fb
      JOIN fleets f ON fb.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE fb.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (banks.length === 0) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    const result = await sql`
      UPDATE fleet_banks
      SET 
        bank_name = ${body.bankName},
        bank_code = ${body.bankCode || null},
        swift_code = ${body.swiftCode || null},
        branch_name = ${body.branchName || null},
        branch_address = ${body.branchAddress || null},
        relationship_manager_name = ${body.relationshipManagerName || null},
        relationship_manager_email = ${body.relationshipManagerEmail || null},
        relationship_manager_phone = ${body.relationshipManagerPhone || null},
        notes = ${body.notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update bank error:", error)
    return NextResponse.json({ error: "Failed to update bank" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Check access
    const banks = await sql`
      SELECT fb.id
      FROM fleet_banks fb
      JOIN fleets f ON fb.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE fb.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (banks.length === 0) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    await sql`DELETE FROM fleet_banks WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete bank error:", error)
    return NextResponse.json({ error: "Failed to delete bank" }, { status: 500 })
  }
}
