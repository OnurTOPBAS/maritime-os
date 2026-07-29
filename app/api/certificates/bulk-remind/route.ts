import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { generateCertificateReminderEmail } from "@/lib/certificate-notifications"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certificateIds } = await request.json()

    if (!certificateIds || certificateIds.length === 0) {
      return NextResponse.json({ error: "No certificates selected" }, { status: 400 })
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
        EXTRACT(DAY FROM (sc.expires_date - CURRENT_DATE)) as days_until_expiry
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN users u ON sc.responsible_person_id = u.id
      WHERE f.company_id = ${session.user.companyId}
        AND sc.id = ANY(${certificateIds})
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

      const { subject, html } = generateCertificateReminderEmail(notification)

      // TODO: Integrate with actual email service
      console.log(`[v0] Sending reminder for certificate ${cert.certificate_name}:`, subject)

      sentCount++
    }

    return NextResponse.json({
      success: true,
      sentCount,
    })
  } catch (error) {
    console.error("[v0] Error sending bulk reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}
