import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { validateFixture } from "@/lib/validation"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const shipId = searchParams.get("shipId")
    const companyId = searchParams.get("companyId")
    const status = searchParams.get("status")

    let fixtures

    if (shipId) {
      const ships = await sql`
        SELECT s.id FROM ships s
        JOIN fleets f ON s.fleet_id = f.id
        JOIN companies c ON f.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE s.id = ${shipId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
      `

      if (ships.length === 0) {
        return NextResponse.json({ error: "Ship not found" }, { status: 404 })
      }

      if (status && status !== "all") {
        fixtures = await sql`
          SELECT f.*, s.name as ship_name, c.name as company_name
          FROM fixtures f
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          WHERE f.ship_id = ${shipId} AND f.status = ${status}
          ORDER BY f.cp_date DESC NULLS LAST, f.created_at DESC
        `
      } else {
        fixtures = await sql`
          SELECT f.*, s.name as ship_name, c.name as company_name
          FROM fixtures f
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          WHERE f.ship_id = ${shipId}
          ORDER BY f.cp_date DESC NULLS LAST, f.created_at DESC
        `
      }
    } else if (companyId) {
      if (status && status !== "all") {
        fixtures = await sql`
          SELECT f.*, s.name as ship_name, s.imo_number, c.name as company_name
          FROM fixtures f
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          WHERE c.id = ${companyId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) AND f.status = ${status}
          ORDER BY f.cp_date DESC NULLS LAST, f.created_at DESC
        `
      } else {
        fixtures = await sql`
          SELECT f.*, s.name as ship_name, s.imo_number, c.name as company_name
          FROM fixtures f
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          WHERE c.id = ${companyId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          ORDER BY f.cp_date DESC NULLS LAST, f.created_at DESC
        `
      }
    } else {
      if (status && status !== "all") {
        fixtures = await sql`
          SELECT f.*, s.name as ship_name, s.imo_number, c.name as company_name
          FROM fixtures f
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) AND f.status = ${status}
          ORDER BY f.cp_date DESC NULLS LAST, f.created_at DESC
        `
      } else {
        fixtures = await sql`
          SELECT f.*, s.name as ship_name, s.imo_number, c.name as company_name
          FROM fixtures f
          JOIN ships s ON f.ship_id = s.id
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          ORDER BY f.cp_date DESC NULLS LAST, f.created_at DESC
        `
      }
    }

    return NextResponse.json(fixtures)
  } catch (error) {
    console.error("[v0] Get fixtures error:", error)
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const data = await request.json()

    const validationErrors = validateFixture(data)
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 })
    }

    const {
      ship_id,
      fixture_type,
      charterer,
      cargo_type,
      rate,
      rate_type,
      cp_date,
      laycan_from,
      laycan_to,
      load_port,
      discharge_port,
      demurrage_rate,
      payment_type,
      status,
      notes,
    } = data

    if (!ship_id || !charterer) {
      return NextResponse.json({ error: "Ship ID and charterer are required" }, { status: 400 })
    }

    const ships = await sql`
      SELECT s.id FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE s.id = ${ship_id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (ships.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const loadPortJson = Array.isArray(load_port) ? JSON.stringify(load_port) : load_port
    const dischargePortJson = Array.isArray(discharge_port) ? JSON.stringify(discharge_port) : discharge_port

    const newFixtures = await sql`
      INSERT INTO fixtures (
        ship_id, fixture_type, charterer, cargo_type, rate, rate_type, cp_date, 
        laycan_from, laycan_to, load_port, discharge_port, 
        demurrage_rate, payment_type, status, notes
      )
      VALUES (
        ${ship_id}, ${fixture_type || null}, ${charterer}, ${cargo_type || null}, ${rate || null}, 
        ${rate_type || null}, ${cp_date || null}, ${laycan_from || null}, 
        ${laycan_to || null}, ${loadPortJson || null}, ${dischargePortJson || null}, 
        ${demurrage_rate || null}, ${payment_type || null}, ${status || "fixed"}, ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json({ fixture: newFixtures[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create fixture error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
