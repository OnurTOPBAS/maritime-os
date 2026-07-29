import { sql } from "@/lib/db"

export interface CertificateNotification {
  certificateId: string
  certificateName: string
  certificateType: string
  shipName: string
  expiresDate: string
  daysUntilExpiry: number
  responsiblePerson?: {
    id: string
    name: string
    email: string
  }
}

export async function getExpiringCertificates(
  companyId: string,
  daysAhead: number,
): Promise<CertificateNotification[]> {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysAhead)

  const results = await sql`
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
    WHERE f.company_id = ${companyId}
      AND sc.expires_date IS NOT NULL
      AND sc.status != 'expired'
      AND sc.expires_date BETWEEN CURRENT_DATE AND ${targetDate.toISOString().split("T")[0]}
      AND (
        (${daysAhead} = 90 AND sc.notify_90_days = true) OR
        (${daysAhead} = 60 AND sc.notify_60_days = true) OR
        (${daysAhead} = 30 AND sc.notify_30_days = true) OR
        (${daysAhead} = 15 AND sc.notify_15_days = true) OR
        (${daysAhead} = 7 AND sc.notify_7_days = true)
      )
      AND (
        sc.last_notification_sent IS NULL OR
        sc.last_notification_sent < CURRENT_DATE - INTERVAL '1 day'
      )
    ORDER BY sc.expires_date ASC
  `

  return results.map((row: any) => ({
    certificateId: row.certificate_id,
    certificateName: row.certificate_name,
    certificateType: row.certificate_type,
    shipName: row.ship_name,
    expiresDate: row.expires_date,
    daysUntilExpiry: Number.parseInt(row.days_until_expiry),
    responsiblePerson: row.responsible_person_id
      ? {
          id: row.responsible_person_id,
          name: row.responsible_person_name,
          email: row.responsible_person_email,
        }
      : undefined,
  }))
}

export async function markNotificationSent(certificateId: string, daysAhead: number, sentTo: string) {
  await sql`
    INSERT INTO certificate_notifications (certificate_id, notification_type, days_before, sent_to)
    VALUES (${certificateId}, 'expiry_reminder', ${daysAhead}, ${sentTo})
  `

  await sql`
    UPDATE ship_certificates
    SET last_notification_sent = CURRENT_DATE
    WHERE id = ${certificateId}
  `
}

export function generateCertificateReminderEmail(notification: CertificateNotification) {
  const subject = `Sertifika Hatırlatması: ${notification.certificateName} - ${notification.shipName}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .info-table td:first-child { font-weight: bold; width: 40%; }
          .urgent { color: #dc2626; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚢 Sertifika Hatırlatması</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <p class="urgent">⚠️ Dikkat: Sertifika süresi ${notification.daysUntilExpiry} gün içinde dolacak!</p>
            </div>
            
            <table class="info-table">
              <tr>
                <td>Gemi:</td>
                <td><strong>${notification.shipName}</strong></td>
              </tr>
              <tr>
                <td>Sertifika:</td>
                <td>${notification.certificateName}</td>
              </tr>
              <tr>
                <td>Tip:</td>
                <td>${notification.certificateType}</td>
              </tr>
              <tr>
                <td>Son Kullanma Tarihi:</td>
                <td><strong>${new Date(notification.expiresDate).toLocaleDateString("tr-TR")}</strong></td>
              </tr>
              <tr>
                <td>Kalan Gün:</td>
                <td class="urgent">${notification.daysUntilExpiry} gün</td>
              </tr>
            </table>

            <p><strong>Yapılması Gerekenler:</strong></p>
            <ul>
              <li>Sertifika yenileme işlemlerini başlatın</li>
              <li>Gerekli belgeleri hazırlayın</li>
              <li>İlgili kurum ile iletişime geçin</li>
              <li>Yenileme randevusu alın</li>
            </ul>

            <div class="footer">
              <p>Bu otomatik bir hatırlatma mesajıdır.</p>
              <p>MaritimeOS - Denizcilik Yönetim Sistemi</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}
