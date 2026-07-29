import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { logActivity } from "@/lib/audit-logger"

const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ship ID format" }, { status: 400 })
    }

    const ships = await sql`
      SELECT s.* FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE s.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (ships.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    return NextResponse.json({ ship: ships[0] })
  } catch (error) {
    console.error("[v0] Get ship error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ship ID format" }, { status: 400 })
    }

    // Verify ownership
    const ships = await sql`
      SELECT s.id FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE s.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (ships.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const oldData = await sql`SELECT * FROM ships WHERE id = ${id}`

    const result = await sql`
      UPDATE ships SET
        name = ${body.name},
        imo_number = ${body.imo_number},
        flag = ${body.flag},
        vessel_type = ${body.vessel_type},
        dwt = ${body.dwt},
        built_year = ${body.built_year},
        status = ${body.status},
        grt = ${body.grt},
        nrt = ${body.nrt},
        main_engine = ${body.main_engine},
        engine_power = ${body.engine_power},
        speed_laden = ${body.speed_laden},
        speed_ballast = ${body.speed_ballast},
        loa = ${body.loa},
        beam = ${body.beam},
        draft = ${body.draft},
        current_position = ${body.current_position},
        latitude = ${body.latitude},
        longitude = ${body.longitude},
        position_updated_at = ${body.position_updated_at},
        consumption_operations = ${body.consumption_operations ? JSON.stringify(body.consumption_operations) : null}::jsonb,
        consumption_laden_speed = ${body.consumption_laden_speed ? JSON.stringify(body.consumption_laden_speed) : null}::jsonb,
        consumption_ballast_speed = ${body.consumption_ballast_speed ? JSON.stringify(body.consumption_ballast_speed) : null}::jsonb,
        particulars_file_url = ${body.particulars_file_url || null},
        fuel_consumption_file_url = ${body.fuel_consumption_file_url || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    await logActivity({
      userId: user.id,
      entityType: "ship",
      entityId: id,
      action: "update",
      changes: { before: oldData[0], after: result[0] },
    })

    return NextResponse.json({ ship: result[0] })
  } catch (error) {
    console.error("[v0] Update ship error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ship ID format" }, { status: 400 })
    }

    // Verify ownership through fleet and company
    const ships = await sql`
      SELECT s.id FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE s.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (ships.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const oldData = await sql`SELECT * FROM ships WHERE id = ${id}`

    await sql`DELETE FROM ships WHERE id = ${id}`

    await logActivity({
      userId: user.id,
      entityType: "ship",
      entityId: id,
      action: "delete",
      changes: { before: oldData[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete ship error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
