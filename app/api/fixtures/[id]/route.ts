import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verify ownership or team membership through ship, fleet, and company
    const fixtures = await sql`
      SELECT fx.id FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE fx.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (fixtures.length === 0) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    await sql`DELETE FROM fixtures WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete fixture error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Verify ownership or team membership
    const fixtures = await sql`
      SELECT fx.id FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE fx.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (fixtures.length === 0) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    const loadPortJson = Array.isArray(body.load_port) ? JSON.stringify(body.load_port) : body.load_port
    const dischargePortJson = Array.isArray(body.discharge_port)
      ? JSON.stringify(body.discharge_port)
      : body.discharge_port

    const result = await sql`
      UPDATE fixtures SET
        fixture_type = ${body.fixture_type || null},
        charterer = ${body.charterer},
        cargo_type = ${body.cargo_type},
        rate = ${body.rate},
        rate_type = ${body.rate_type},
        cp_date = ${body.cp_date},
        laycan_from = ${body.laycan_from},
        laycan_to = ${body.laycan_to},
        load_port = ${loadPortJson},
        discharge_port = ${dischargePortJson},
        demurrage_rate = ${body.demurrage_rate},
        payment_type = ${body.payment_type || null},
        status = ${body.status},
        notes = ${body.notes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ fixture: result[0] })
  } catch (error) {
    console.error("[v0] Update fixture error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
