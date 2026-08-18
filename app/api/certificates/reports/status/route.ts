import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { getAccessibleCompanyIds, isSuperAdmin } from "@/lib/authz"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Şirket izolasyonu: kullanıcı yalnızca erişebildiği şirketlerin gemilerinin
    // sertifikalarını görür. Önceden hiç sınır yoktu (WHERE 1=1).
    const superAdmin = await isSuperAdmin(user.id)
    const allowed = await getAccessibleCompanyIds(user.id)
    if (!superAdmin && allowed.length === 0) {
      return NextResponse.json({
        certificates: [],
        stats: { total: 0, valid: 0, warning: 0, critical: 0, expired: 0, no_date: 0 },
      })
    }

    const searchParams = request.nextUrl.searchParams
    const fleetId = searchParams.get("fleetId")
    const shipId = searchParams.get("shipId")

    let query = sql`
      SELECT 
        sc.*,
        s.name as ship_name,
        s.imo_number,
        f.name as fleet_name,
        CASE 
          WHEN sc.expires_date IS NULL THEN 'no_date'
          WHEN sc.expires_date::date < CURRENT_DATE THEN 'expired'
          WHEN sc.expires_date::date < CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
          WHEN sc.expires_date::date < CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
          ELSE 'valid'
        END as expiry_status,
        CASE 
          WHEN sc.expires_date IS NOT NULL THEN 
            (sc.expires_date::date - CURRENT_DATE)
          ELSE NULL
        END as days_until_expiry
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE 1=1
    `

    // Süper yönetici hariç yalnızca erişilebilir şirketlerin gemileri.
    if (!superAdmin) {
      query = sql`${query} AND f.company_id = ANY(${allowed}::uuid[])`
    }

    if (fleetId) {
      query = sql`${query} AND s.fleet_id = ${fleetId}`
    }

    if (shipId) {
      query = sql`${query} AND sc.ship_id = ${shipId}`
    }

    query = sql`${query} ORDER BY sc.expires_date ASC NULLS LAST`

    const certificates = await query

    // Calculate statistics
    const stats = {
      total: certificates.length,
      valid: certificates.filter((c: any) => c.expiry_status === "valid").length,
      warning: certificates.filter((c: any) => c.expiry_status === "warning").length,
      critical: certificates.filter((c: any) => c.expiry_status === "critical").length,
      expired: certificates.filter((c: any) => c.expiry_status === "expired").length,
      no_date: certificates.filter((c: any) => c.expiry_status === "no_date").length,
    }

    // Group by certificate type
    const byType: Record<string, number> = {}
    certificates.forEach((cert: any) => {
      byType[cert.certificate_type] = (byType[cert.certificate_type] || 0) + 1
    })

    // Group by ship
    const byShip: Record<string, any> = {}
    certificates.forEach((cert: any) => {
      if (!byShip[cert.ship_id]) {
        byShip[cert.ship_id] = {
          ship_name: cert.ship_name,
          imo_number: cert.imo_number,
          fleet_name: cert.fleet_name,
          total: 0,
          expired: 0,
          critical: 0,
          warning: 0,
        }
      }
      byShip[cert.ship_id].total++
      if (cert.expiry_status === "expired") byShip[cert.ship_id].expired++
      if (cert.expiry_status === "critical") byShip[cert.ship_id].critical++
      if (cert.expiry_status === "warning") byShip[cert.ship_id].warning++
    })

    return NextResponse.json({
      certificates,
      stats,
      byType,
      byShip: Object.values(byShip),
    })
  } catch (error) {
    console.error("[v0] Error generating certificate status report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
