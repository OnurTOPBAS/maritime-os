import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = Number.parseInt(searchParams.get("days") || "90")
    const fleetId = searchParams.get("fleetId")

    let query = sql`
      SELECT 
        sc.*,
        s.name as ship_name,
        s.imo_number,
        f.name as fleet_name,
        EXTRACT(DAY FROM (sc.expires_date - CURRENT_DATE)) as days_until_expiry,
        u.name as responsible_person_name,
        u.email as responsible_person_email
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN users u ON sc.responsible_person_id = u.id
      WHERE sc.expires_date IS NOT NULL
        AND sc.expires_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        AND sc.status != 'not_applicable'
    `

    if (fleetId) {
      query = sql`${query} AND s.fleet_id = ${fleetId}`
    }

    query = sql`${query} ORDER BY sc.expires_date ASC`

    const expiringCertificates = await query

    return NextResponse.json(expiringCertificates)
  } catch (error) {
    console.error("[v0] Error generating expiring certificates report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
