import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Kullanıcının erişebildiği tüm gemi sertifikaları.
 *
 * Not: Bu rota daha önce session.user.companyId okuyordu. getSession()
 * ise { id, email, name } döndürür — user/companyId alanları hiç yok.
 * Dolayısıyla koşul her zaman doğru olup rota HER İSTEKTE 401 dönüyordu,
 * yani özellik fiilen çalışmıyordu. Erişim artık üyelik üzerinden belirlenir.
 */
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
      WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
      ORDER BY s.name, sc.certificate_name
    `

    return NextResponse.json(certificates)
  } catch (error) {
    return handleApiError(error, "Sertifika listesi")
  }
}
