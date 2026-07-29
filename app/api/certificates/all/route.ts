import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const certificates = await sql`
      SELECT 
        sc.id,
        sc.certificate_name,
        sc.certificate_type,
        sc.certificate_number,
        sc.issued_date,
        sc.expires_date,
        sc.file_url,
        sc.status,
        s.id as ship_id,
        s.name as ship_name
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ${session.user.companyId}
      ORDER BY s.name, sc.certificate_name
    `

    return NextResponse.json(certificates)
  } catch (error) {
    console.error("[v0] Error fetching all certificates:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
