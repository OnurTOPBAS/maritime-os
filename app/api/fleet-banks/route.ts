import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const fleetId = searchParams.get("fleetId")

    if (!fleetId) {
      return NextResponse.json({ error: "Fleet ID is required" }, { status: 400 })
    }

    // Check if user has access to this fleet (owner or team member)
    const fleetAccess = await sql`
      SELECT f.id
      FROM fleets f
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE f.id = ${fleetId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (fleetAccess.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get banks with their accounts
    const banks = await sql`
      SELECT 
        fb.*,
        json_agg(
          json_build_object(
            'id', ba.id,
            'account_name', ba.account_name,
            'account_number', ba.account_number,
            'currency', ba.currency,
            'iban', ba.iban,
            'account_type', ba.account_type,
            'is_active', ba.is_active,
            'notes', ba.notes,
            'created_at', ba.created_at
          ) ORDER BY ba.created_at DESC
        ) FILTER (WHERE ba.id IS NOT NULL) as accounts
      FROM fleet_banks fb
      LEFT JOIN bank_accounts ba ON fb.id = ba.bank_id
      WHERE fb.fleet_id = ${fleetId}
      GROUP BY fb.id
      ORDER BY fb.created_at DESC
    `

    return NextResponse.json(banks)
  } catch (error) {
    console.error("[v0] Get fleet banks error:", error)
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const {
      fleetId,
      bankName,
      bankCode,
      swiftCode,
      branchName,
      branchAddress,
      relationshipManagerName,
      relationshipManagerEmail,
      relationshipManagerPhone,
      notes,
    } = body

    if (!fleetId || !bankName) {
      return NextResponse.json({ error: "Fleet ID and bank name are required" }, { status: 400 })
    }

    // Check if user has access to this fleet
    const fleetAccess = await sql`
      SELECT f.id
      FROM fleets f
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE f.id = ${fleetId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (fleetAccess.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const result = await sql`
      INSERT INTO fleet_banks (
        fleet_id, bank_name, bank_code, swift_code, branch_name, branch_address,
        relationship_manager_name, relationship_manager_email, relationship_manager_phone, notes
      )
      VALUES (
        ${fleetId}, ${bankName}, ${bankCode || null}, ${swiftCode || null}, ${branchName || null}, ${branchAddress || null},
        ${relationshipManagerName || null}, ${relationshipManagerEmail || null}, ${relationshipManagerPhone || null}, ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Create fleet bank error:", error)
    return NextResponse.json({ error: "Failed to create bank" }, { status: 500 })
  }
}
