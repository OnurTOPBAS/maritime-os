import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { logActivity } from "@/lib/audit-logger"
import { validateShip } from "@/lib/validation"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const fleetId = searchParams.get("fleetId")

    if (!fleetId) {
      const ships = await sql`
        SELECT 
          s.*,
          f.name as fleet_name,
          c.name as company_name
        FROM ships s
        JOIN fleets f ON s.fleet_id = f.id
        JOIN companies c ON f.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL
        ORDER BY s.created_at DESC
      `
      return NextResponse.json(ships)
    }

    const fleets = await sql`
      SELECT f.id FROM fleets f
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE f.id = ${fleetId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (fleets.length === 0) {
      return NextResponse.json({ error: "Fleet not found" }, { status: 404 })
    }

    const ships = await sql`
      SELECT * FROM ships 
      WHERE fleet_id = ${fleetId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ ships })
  } catch (error) {
    console.error("[v0] Get ships error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const data = await request.json()

    const validationErrors = validateShip(data)
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 })
    }

    const { fleet_id, name, imo_number, flag, vessel_type, dwt, built_year, status } = data

    if (!fleet_id || !name) {
      return NextResponse.json({ error: "Fleet ID and name are required" }, { status: 400 })
    }

    if (imo_number) {
      const existingShip = await sql`
        SELECT id FROM ships WHERE imo_number = ${imo_number}
      `
      if (existingShip.length > 0) {
        return NextResponse.json(
          { errors: [{ field: "imo_number", message: "Bu IMO numarası zaten kayıtlı" }] },
          { status: 400 },
        )
      }
    }

    const fleets = await sql`
      SELECT f.id FROM fleets f
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE f.id = ${fleet_id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (fleets.length === 0) {
      return NextResponse.json({ error: "Fleet not found" }, { status: 404 })
    }

    const newShips = await sql`
      INSERT INTO ships (
        fleet_id, name, imo_number, flag, vessel_type, dwt, built_year, status,
        grt, nrt, main_engine, engine_power, speed_laden, speed_ballast,
        loa, beam, draft, current_position, latitude, longitude, position_updated_at,
        consumption_operations, consumption_laden_speed, consumption_ballast_speed,
        particulars_file_url, fuel_consumption_file_url
      )
      VALUES (
        ${fleet_id}, 
        ${name}, 
        ${imo_number || null}, 
        ${flag || null}, 
        ${vessel_type || null}, 
        ${dwt || null}, 
        ${built_year || null}, 
        ${status || "active"},
        ${data.grt || null},
        ${data.nrt || null},
        ${data.main_engine || null},
        ${data.engine_power || null},
        ${data.speed_laden || null},
        ${data.speed_ballast || null},
        ${data.loa || null},
        ${data.beam || null},
        ${data.draft || null},
        ${data.current_position || null},
        ${data.latitude || null},
        ${data.longitude || null},
        ${data.position_updated_at || null},
        ${data.consumption_operations ? JSON.stringify(data.consumption_operations) : null}::jsonb,
        ${data.consumption_laden_speed ? JSON.stringify(data.consumption_laden_speed) : null}::jsonb,
        ${data.consumption_ballast_speed ? JSON.stringify(data.consumption_ballast_speed) : null}::jsonb,
        ${data.particulars_file_url || null},
        ${data.fuel_consumption_file_url || null}
      )
      RETURNING *
    `

    await logActivity({
      userId: user.id,
      entityType: "ship",
      entityId: newShips[0].id,
      action: "create",
      changes: { after: newShips[0] },
    })

    return NextResponse.json({ ship: newShips[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create ship error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
