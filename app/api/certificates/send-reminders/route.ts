import { NextResponse } from "next/server"
import {
  getExpiringCertificates,
  markNotificationSent,
  generateCertificateReminderEmail,
} from "@/lib/certificate-notifications"
import { getSession } from "@/lib/auth"

export async function POST() {
  try {
    const session = await getSession()
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reminderDays = [90, 60, 30, 15, 7]
    let totalSent = 0

    for (const days of reminderDays) {
      const certificates = await getExpiringCertificates(session.user.companyId, days)

      for (const cert of certificates) {
        const { subject, html } = generateCertificateReminderEmail(cert)

        // Send to responsible person if assigned, otherwise to company admin
        const recipient = cert.responsiblePerson?.email || session.user.email

        // TODO: Integrate with actual email service
        console.log(`[v0] Sending certificate reminder to ${recipient}:`, subject)

        // For now, just mark as sent
        await markNotificationSent(cert.certificateId, days, recipient)
        totalSent++
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: totalSent,
    })
  } catch (error) {
    console.error("[v0] Error sending certificate reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}
