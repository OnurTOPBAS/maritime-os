import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fixtureId = (await params).id

    const fixtures = await sql`
      SELECT f.* FROM fixtures f
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE f.id = ${fixtureId} 
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (fixtures.length === 0) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    const original = fixtures[0]

    const newFixtures = await sql`
      INSERT INTO fixtures (
        ship_id, charterer, cargo_type, rate, rate_type, cp_date,
        laycan_from, laycan_to, load_port, discharge_port,
        demurrage_rate, status, notes
      ) VALUES (
        ${original.ship_id},
        ${original.charterer},
        ${original.cargo_type},
        ${original.rate},
        ${original.rate_type},
        ${original.cp_date},
        ${original.laycan_from},
        ${original.laycan_to},
        ${original.load_port},
        ${original.discharge_port},
        ${original.demurrage_rate},
        'draft',
        ${original.notes ? original.notes + " (Kopya)" : "(Kopya)"}
      )
      RETURNING *
    `

    return NextResponse.json(newFixtures[0])
  } catch (error) {
    console.error("[v0] Copy fixture error:", error)
    return NextResponse.json({ error: "Failed to copy fixture" }, { status: 500 })
  }
}
