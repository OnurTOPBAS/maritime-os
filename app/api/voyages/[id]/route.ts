import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid voyage ID format" }, { status: 404 })
    }

    const result = await sql`
      SELECT 
        v.*,
        f.charterer,
        f.laycan_from,
        f.laycan_to,
        f.rate as freight_rate,
        f.rate_type as freight_rate_type,
        f.cargo_type,
        f.demurrage_rate,
        s.name as ship_name,
        s.imo_number,
        fl.name as fleet_name,
        c.name as company_name
      FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE v.id = ${id}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Voyage not found or access denied" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Get voyage error:", error)
    return NextResponse.json({ error: "Failed to fetch voyage" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid voyage ID format" }, { status: 400 })
    }

    const accessCheck = await sql`
      SELECT v.id FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE v.id = ${id}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (accessCheck.length === 0) {
      return NextResponse.json({ error: "Voyage not found or access denied" }, { status: 404 })
    }

    const result = await sql`
      UPDATE voyages SET
        voyage_number = ${body.voyage_number},
        status = ${body.status},
        load_port = ${body.load_port},
        load_country = ${body.load_country},
        eta_load = ${body.eta_load},
        etb_load = ${body.etb_load},
        etc_load = ${body.etc_load},
        etd_load = ${body.etd_load},
        discharge_port = ${body.discharge_port},
        discharge_country = ${body.discharge_country},
        eta_discharge = ${body.eta_discharge},
        etb_discharge = ${body.etb_discharge},
        etc_discharge = ${body.etc_discharge},
        etd_discharge = ${body.etd_discharge},
        cargo_quantity = ${body.cargo_quantity},
        cargo_unit = ${body.cargo_unit},
        laytime_allowed_load = ${body.laytime_allowed_load},
        laytime_used_load = ${body.laytime_used_load},
        laytime_allowed_discharge = ${body.laytime_allowed_discharge},
        laytime_used_discharge = ${body.laytime_used_discharge},
        demurrage_amount = ${body.demurrage_amount},
        despatch_amount = ${body.despatch_amount},
        notes = ${body.notes},
        loading_ports = ${JSON.stringify(body.loading_ports || [])},
        discharge_ports = ${JSON.stringify(body.discharge_ports || [])},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Voyage not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update voyage error:", error)
    return NextResponse.json({ error: "Failed to update voyage" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid voyage ID format" }, { status: 400 })
    }

    const accessCheck = await sql`
      SELECT v.id FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE v.id = ${id}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (accessCheck.length === 0) {
      return NextResponse.json({ error: "Voyage not found or access denied" }, { status: 404 })
    }

    await sql`DELETE FROM voyages WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete voyage error:", error)
    return NextResponse.json({ error: "Failed to delete voyage" }, { status: 500 })
  }
}
