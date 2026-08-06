import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { generateCertificateReminderEmail } from "@/lib/certificate-notifications"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    const { certificateIds } = await request.json()

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return NextResponse.json({ error: "Sertifika seçilmedi" }, { status: 400 })
    }

    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ error: "Erişilebilir sertifika yok" }, { status: 403 })
    }

    const certificates = await sql`
      SELECT
        sc.id as certificate_id,
        sc.certificate_name,
        sc.certificate_type,
        sc.expires_date,
        sc.responsible_person_id,
        s.name as ship_name,
        u.name as responsible_person_name,
        u.email as responsible_person_email,
        (sc.expires_date - CURRENT_DATE) as days_until_expiry
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN users u ON sc.responsible_person_id = u.id
      WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
        AND sc.id = ANY(${certificateIds}::uuid[])
        AND sc.expires_date IS NOT NULL
    `

    let sentCount = 0

    for (const cert of certificates) {
      const notification = {
        certificateId: cert.certificate_id,
        certificateName: cert.certificate_name,
        certificateType: cert.certificate_type,
        shipName: cert.ship_name,
        expiresDate: cert.expires_date,
        daysUntilExpiry: Number.parseInt(cert.days_until_expiry),
        responsiblePerson: cert.responsible_person_id
          ? {
              id: cert.responsible_person_id,
              name: cert.responsible_person_name,
              email: cert.responsible_person_email,
            }
          : undefined,
      }

      // NOT: Gerçek e-posta gönderimi henüz bağlanmadı (mevcut davranış korundu).
      generateCertificateReminderEmail(notification)
      sentCount++
    }

    return NextResponse.json({ success: true, sentCount })
  } catch (error) {
    return handleApiError(error, "Toplu sertifika hatırlatma")
  }
}
