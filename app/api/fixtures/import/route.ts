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
    const { fixtures } = body

    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      return NextResponse.json({ error: "No fixtures data provided" }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const fixture of fixtures) {
      try {
        if (!fixture.charterer) {
          results.failed++
          results.errors.push(`Charterer adı eksik`)
          continue
        }

        await sql`
          INSERT INTO fixtures (
            charterer, ship_id, fixture_type, cargo_type, load_port,
            discharge_port, laycan_from, laycan_to, rate, rate_type,
            cp_date, status, notes
          ) VALUES (
            ${fixture.charterer}, ${fixture.ship_id || null},
            ${fixture.fixture_type || null}, ${fixture.cargo_type || null},
            ${fixture.load_port || null}, ${fixture.discharge_port || null},
            ${fixture.laycan_from || null}, ${fixture.laycan_to || null},
            ${fixture.rate || null}, ${fixture.rate_type || null},
            ${fixture.cp_date || null}, ${fixture.status || "fixed"},
            ${fixture.notes || null}
          )
        `
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${fixture.charterer}: ${error.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Error importing fixtures:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
