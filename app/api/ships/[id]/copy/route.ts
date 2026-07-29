import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { logActivity } from "@/lib/audit-logger"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const shipId = params.id

    const ships = await sql`
      SELECT s.*, f.company_id 
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      WHERE s.id = ${shipId} AND c.owner_id = ${user.id}
    `

    if (ships.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const originalShip = ships[0]

    const newShips = await sql`
      INSERT INTO ships (
        fleet_id, name, imo_number, flag, vessel_type, 
        dwt, built_year, status, grt, nrt, main_engine, 
        engine_power, speed_laden, speed_ballast, loa, beam, draft,
        current_position, latitude, longitude, position_updated_at,
        consumption_operations, consumption_laden_speed, consumption_ballast_speed,
        particulars_file_url, fuel_consumption_file_url
      ) VALUES (
        ${originalShip.fleet_id},
        ${originalShip.name + " (Kopya)"},
        ${originalShip.imo_number ? originalShip.imo_number + "-COPY" : null},
        ${originalShip.flag},
        ${originalShip.vessel_type},
        ${originalShip.dwt},
        ${originalShip.built_year},
        'inactive',
        ${originalShip.grt},
        ${originalShip.nrt},
        ${originalShip.main_engine},
        ${originalShip.engine_power},
        ${originalShip.speed_laden},
        ${originalShip.speed_ballast},
        ${originalShip.loa},
        ${originalShip.beam},
        ${originalShip.draft},
        ${originalShip.current_position},
        ${originalShip.latitude},
        ${originalShip.longitude},
        ${originalShip.position_updated_at},
        ${originalShip.consumption_operations},
        ${originalShip.consumption_laden_speed},
        ${originalShip.consumption_ballast_speed},
        ${originalShip.particulars_file_url},
        ${originalShip.fuel_consumption_file_url}
      )
      RETURNING *
    `

    await logActivity({
      userId: user.id,
      entityType: "ship",
      entityId: newShips[0].id,
      action: "create",
      changes: { after: newShips[0], note: `Copied from ship ${shipId}` },
    })

    return NextResponse.json(newShips[0])
  } catch (error) {
    console.error("[v0] Copy ship error:", error)
    return NextResponse.json({ error: "Failed to copy ship" }, { status: 500 })
  }
}
