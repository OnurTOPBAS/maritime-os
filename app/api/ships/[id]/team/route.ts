import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const shipId = (await params).id

    // Get the company_id for this ship through fleet
    const shipData = await sql`
      SELECT f.company_id
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE s.id = ${shipId}
    `

    if (shipData.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const companyId = shipData[0].company_id

    // Verify user has access to this company
    const hasAccess = await sql`
      SELECT 1 FROM companies c
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE c.id = ${companyId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get team members for this company
    const teamMembers = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        ctm.role
      FROM company_team_members ctm
      JOIN users u ON ctm.user_id = u.id
      WHERE ctm.company_id = ${companyId}
      ORDER BY u.name
    `

    return NextResponse.json({ teamMembers })
  } catch (error) {
    console.error("[v0] Error fetching team members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
