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
    const { voyages } = body

    if (!Array.isArray(voyages) || voyages.length === 0) {
      return NextResponse.json({ error: "No voyages data provided" }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const voyage of voyages) {
      try {
        if (!voyage.voyage_number) {
          results.failed++
          results.errors.push(`Sefer numarası eksik`)
          continue
        }

        await sql`
          INSERT INTO voyages (
            voyage_number, fixture_id, load_port, discharge_port,
            eta_load, etd_load, eta_discharge, etd_discharge,
            cargo_quantity, cargo_unit, status, notes
          ) VALUES (
            ${voyage.voyage_number}, ${voyage.fixture_id || null},
            ${voyage.load_port || null}, ${voyage.discharge_port || null},
            ${voyage.eta_load || null}, ${voyage.etd_load || null},
            ${voyage.eta_discharge || null}, ${voyage.etd_discharge || null},
            ${voyage.cargo_quantity || null}, ${voyage.cargo_unit || null},
            ${voyage.status || "planned"}, ${voyage.notes || null}
          )
        `
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${voyage.voyage_number}: ${error.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Error importing voyages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
