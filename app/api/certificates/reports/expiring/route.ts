import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Süresi dolan sertifikalar raporu.
 *
 * Düzeltmeler:
 *  - `INTERVAL '${days} days'` etiketli şablon içinde string birleştirme
 *    yapıyordu; bu hem "parametre tipi belirlenemedi" hatası veriyor hem de
 *    SQL enjeksiyonuna kapı açıyordu. Aralık artık güvenli biçimde çarpımla
 *    hesaplanır: CURRENT_DATE + (gün * INTERVAL '1 day').
 *  - Sahiplik filtresi yoktu: rapor TÜM şirketlerin sertifikalarını
 *    döndürüyordu. Artık kullanıcının eriştiği şirketlerle sınırlıdır.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const rawDays = Number.parseInt(searchParams.get("days") || "90", 10)
    const days = Number.isFinite(rawDays) ? Math.min(Math.max(rawDays, 1), 3650) : 90
    const fleetId = searchParams.get("fleetId")

    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json([])
    }

    // Belirli bir filo istendiyse o filoya erişim doğrulanır.
    if (fleetId) {
      const [fleet] = await sql`SELECT company_id FROM fleets WHERE id = ${fleetId}`
      if (!fleet || !allowedCompanyIds.includes(fleet.company_id)) {
        return NextResponse.json({ error: "Filo bulunamadı" }, { status: 404 })
      }
    }

    const expiringCertificates = await sql`
      SELECT
        sc.*,
        s.name as ship_name,
        s.imo_number,
        f.name as fleet_name,
        (sc.expires_date - CURRENT_DATE) as days_until_expiry,
        u.name as responsible_person_name,
        u.email as responsible_person_email
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN users u ON sc.responsible_person_id = u.id
      WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
        AND (${fleetId ?? null}::uuid IS NULL OR s.fleet_id = ${fleetId ?? null}::uuid)
        AND sc.expires_date IS NOT NULL
        AND sc.expires_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (${days} * INTERVAL '1 day')
        AND sc.status != 'not_applicable'
      ORDER BY sc.expires_date ASC
    `

    return NextResponse.json(expiringCertificates)
  } catch (error) {
    return handleApiError(error, "Süresi dolan sertifikalar raporu")
  }
}
