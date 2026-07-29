import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const authResponse = await fetch(new URL("/api/auth/me", request.url).toString(), {
      headers: request.headers,
    })

    if (!authResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await authResponse.json()
    const userId = userData.user?.id

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const body = await request.json()
    const { ships, fleetId } = body

    if (!Array.isArray(ships) || ships.length === 0) {
      return NextResponse.json({ error: "No ships data provided" }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const ship of ships) {
      try {
        if (!ship.name) {
          results.failed++
          results.errors.push(`Gemi adı eksik`)
          continue
        }

        await sql`
          INSERT INTO ships (
            name, imo_number, flag, vessel_type, dwt, grt, nrt,
            built_year, loa, beam, draft, main_engine, engine_power,
            speed_laden, speed_ballast, status, current_position, fleet_id
          ) VALUES (
            ${ship.name}, ${ship.imo_number || null}, ${ship.flag || null},
            ${ship.vessel_type || null}, ${ship.dwt || null}, ${ship.grt || null},
            ${ship.nrt || null}, ${ship.built_year || null}, ${ship.loa || null},
            ${ship.beam || null}, ${ship.draft || null}, ${ship.main_engine || null},
            ${ship.engine_power || null}, ${ship.speed_laden || null},
            ${ship.speed_ballast || null}, ${ship.status || "active"},
            ${ship.current_position || null}, ${fleetId || null}
          )
        `
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${ship.name}: ${error.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Error importing ships:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
