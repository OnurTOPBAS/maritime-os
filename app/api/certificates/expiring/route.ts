import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/** Önümüzdeki 90 gün içinde süresi dolacak sertifikalar. */
export async function GET() {
  try {
    const user = await requireAuth()

    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json([])
    }

    const certificates = await sql`
      SELECT
        sc.id,
        sc.certificate_name,
        sc.certificate_type,
        sc.expires_date,
        sc.status,
        s.id as ship_id,
        s.name as ship_name,
        (sc.expires_date - CURRENT_DATE) as days_until_expiry
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
        AND sc.expires_date IS NOT NULL
        AND sc.expires_date >= CURRENT_DATE
        AND sc.expires_date <= CURRENT_DATE + INTERVAL '90 days'
        AND sc.status != 'not_applicable'
      ORDER BY sc.expires_date ASC
      LIMIT 50
    `

    return NextResponse.json(
      certificates.map((cert: any) => ({
        id: cert.id,
        certificate_name: cert.certificate_name,
        certificate_type: cert.certificate_type,
        ship_name: cert.ship_name,
        ship_id: cert.ship_id,
        expires_date: cert.expires_date,
        days_until_expiry: Number.parseInt(cert.days_until_expiry),
        status: cert.status,
      })),
    )
  } catch (error) {
    return handleApiError(error, "Süresi dolan sertifikalar")
  }
}
