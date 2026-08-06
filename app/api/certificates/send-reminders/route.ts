import { NextResponse } from "next/server"
import {
  getExpiringCertificates,
  markNotificationSent,
  generateCertificateReminderEmail,
} from "@/lib/certificate-notifications"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function POST() {
  try {
    const user = await requireAuth()

    // Önceden session.user.companyId okunuyordu; böyle bir alan olmadığı için
    // rota her istekte 401 dönüyor ve hatırlatmalar hiç gönderilmiyordu.
    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ success: true, remindersSent: 0 })
    }

    const reminderDays = [90, 60, 30, 15, 7]
    let totalSent = 0

    for (const companyId of allowedCompanyIds) {
      for (const days of reminderDays) {
        const certificates = await getExpiringCertificates(companyId, days)

        for (const cert of certificates) {
          generateCertificateReminderEmail(cert)

          // Sorumlu atanmışsa ona, yoksa isteği yapan kullanıcıya.
          const recipient = cert.responsiblePerson?.email || user.email

          // NOT: Gerçek e-posta gönderimi henüz bağlanmadı (mevcut davranış korundu).
          await markNotificationSent(cert.certificateId, days, recipient)
          totalSent++
        }
      }
    }

    return NextResponse.json({ success: true, remindersSent: totalSent })
  } catch (error) {
    return handleApiError(error, "Sertifika hatırlatmaları")
  }
}
