import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const fixtureId = searchParams.get("fixtureId")
    const status = searchParams.get("status")

    let voyages

    if (fixtureId && fixtureId !== "all") {
      if (status && status !== "all") {
        voyages = await sql`
          SELECT v.*, f.charterer, s.name as ship_name
          FROM voyages v
          JOIN fixtures f ON v.fixture_id = f.id
          JOIN ships s ON f.ship_id = s.id
          WHERE v.fixture_id = ${fixtureId} AND v.status = ${status}
          ORDER BY v.created_at DESC
        `
      } else {
        voyages = await sql`
          SELECT v.*, f.charterer, s.name as ship_name
          FROM voyages v
          JOIN fixtures f ON v.fixture_id = f.id
          JOIN ships s ON f.ship_id = s.id
          WHERE v.fixture_id = ${fixtureId}
          ORDER BY v.created_at DESC
        `
      }
    } else {
      if (status && status !== "all") {
        voyages = await sql`
          SELECT DISTINCT v.*, f.charterer, s.name as ship_name
          FROM voyages v
          JOIN fixtures f ON v.fixture_id = f.id
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
            AND v.status = ${status}
          ORDER BY v.created_at DESC
        `
      } else {
        voyages = await sql`
          SELECT DISTINCT v.*, f.charterer, s.name as ship_name
          FROM voyages v
          JOIN fixtures f ON v.fixture_id = f.id
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          WHERE c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL
          ORDER BY v.created_at DESC
        `
      }
    }

    return NextResponse.json(voyages)
  } catch (error) {
    console.error("[v0] Get voyages error:", error)
    return NextResponse.json({ error: "Failed to fetch voyages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()

    const result = await sql`
      INSERT INTO voyages (
        fixture_id, voyage_number, status,
        load_port, load_country, eta_load, etb_load, etc_load, etd_load,
        discharge_port, discharge_country, eta_discharge, etb_discharge, etc_discharge, etd_discharge,
        cargo_quantity, cargo_unit,
        laytime_allowed_load, laytime_used_load, laytime_allowed_discharge, laytime_used_discharge,
        demurrage_amount, despatch_amount, notes,
        loading_ports, discharge_ports
      ) VALUES (
        ${body.fixture_id}, ${body.voyage_number}, ${body.status || "planned"},
        ${body.load_port ?? null}, ${body.load_country ?? null}, ${body.eta_load ?? null}, ${body.etb_load ?? null}, ${body.etc_load ?? null}, ${body.etd_load ?? null},
        ${body.discharge_port ?? null}, ${body.discharge_country ?? null}, ${body.eta_discharge ?? null}, ${body.etb_discharge ?? null}, ${body.etc_discharge ?? null}, ${body.etd_discharge ?? null},
        ${body.cargo_quantity ?? null}, ${body.cargo_unit || "MT"},
        ${body.laytime_allowed_load ?? null}, ${body.laytime_used_load ?? null}, ${body.laytime_allowed_discharge ?? null}, ${body.laytime_used_discharge ?? null},
        ${body.demurrage_amount ?? null}, ${body.despatch_amount ?? null}, ${body.notes ?? null},
        ${JSON.stringify(body.loading_ports || [])}, ${JSON.stringify(body.discharge_ports || [])}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Create voyage error:", error)
    return NextResponse.json({ error: "Failed to create voyage" }, { status: 500 })
  }
}
