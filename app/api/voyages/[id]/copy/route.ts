import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const voyageId = (await params).id

    const voyages = await sql`
      SELECT v.* FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE v.id = ${voyageId}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (voyages.length === 0) {
      return NextResponse.json({ error: "Voyage not found" }, { status: 404 })
    }

    const original = voyages[0]

    const loadingPorts = original.loading_ports
      ? typeof original.loading_ports === "string"
        ? original.loading_ports
        : JSON.stringify(original.loading_ports)
      : null

    const dischargePorts = original.discharge_ports
      ? typeof original.discharge_ports === "string"
        ? original.discharge_ports
        : JSON.stringify(original.discharge_ports)
      : null

    const newVoyages = await sql`
      INSERT INTO voyages (
        fixture_id, voyage_number, status,
        load_port, load_country, eta_load, etb_load, etc_load, etd_load,
        discharge_port, discharge_country, eta_discharge, etb_discharge, etc_discharge, etd_discharge,
        cargo_quantity, cargo_unit,
        laytime_allowed_load, laytime_used_load, laytime_allowed_discharge, laytime_used_discharge,
        demurrage_amount, despatch_amount,
        loading_ports, discharge_ports,
        notes
      ) VALUES (
        ${original.fixture_id},
        ${original.voyage_number + "-COPY"},
        'planned',
        ${original.load_port},
        ${original.load_country},
        ${original.eta_load},
        ${original.etb_load},
        ${original.etc_load},
        ${original.etd_load},
        ${original.discharge_port},
        ${original.discharge_country},
        ${original.eta_discharge},
        ${original.etb_discharge},
        ${original.etc_discharge},
        ${original.etd_discharge},
        ${original.cargo_quantity},
        ${original.cargo_unit},
        ${original.laytime_allowed_load},
        ${original.laytime_used_load},
        ${original.laytime_allowed_discharge},
        ${original.laytime_used_discharge},
        ${original.demurrage_amount},
        ${original.despatch_amount},
        ${loadingPorts}::jsonb,
        ${dischargePorts}::jsonb,
        ${original.notes ? original.notes + " (Kopya)" : "(Kopya)"}
      )
      RETURNING *
    `

    return NextResponse.json(newVoyages[0])
  } catch (error) {
    console.error("[v0] Copy voyage error:", error)
    return NextResponse.json({ error: "Failed to copy voyage" }, { status: 500 })
  }
}
