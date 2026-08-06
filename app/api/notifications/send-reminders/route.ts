import { type NextRequest, NextResponse } from "next/server"
import { sendEmail, generateInvoiceReminderEmail, generateLaycanAlertEmail } from "@/lib/email-service"
import { sql } from "@/lib/db"
import { handleApiError } from "@/lib/api-error"

/**
 * Zamanlanmış görev: yaklaşan fatura vadeleri ve laycan tarihleri için
 * hatırlatma e-postası gönderir.
 *
 * Bu uç nokta bir kullanıcı adına değil, zamanlayıcı (cron) tarafından
 * çağrılır ve TÜM şirketlerin sahiplerine e-posta gönderir. Önceden hiçbir
 * koruma yoktu: internetteki herkes çağırarak toplu e-posta gönderimini
 * tetikleyebilirdi (spam ve maliyet riski).
 *
 * Koruma: CRON_SECRET ortam değişkeni ile paylaşılan gizli anahtar.
 * Çağrı örneği:
 *   curl -X POST https://sunucu/api/notifications/send-reminders \
 *        -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET

    // Gizli anahtar tanımlı değilse uç nokta çalışmaz; yanlışlıkla korumasız
    // kalmasındansa devre dışı olması yeğdir.
    if (!cronSecret) {
      console.error("[Hatırlatmalar] CRON_SECRET tanımlı değil; uç nokta devre dışı.")
      return NextResponse.json({ error: "Bu uç nokta yapılandırılmamış" }, { status: 503 })
    }

    const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    if (provided !== cronSecret) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
    }

    const upcomingInvoices = await sql`
      SELECT i.*, c.name as company_name, u.email as user_email
      FROM invoices i
      JOIN companies c ON i.company_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE i.status = 'pending'
      AND i.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    `

    for (const invoice of upcomingInvoices) {
      const daysUntilDue = Math.ceil(
        (new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )
      const { subject, html } = generateInvoiceReminderEmail(invoice, daysUntilDue)
      await sendEmail({ to: invoice.user_email, subject, html })
    }

    const upcomingFixtures = await sql`
      SELECT f.*, s.name as ship_name, c.name as company_name, u.email as user_email
      FROM fixtures f
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE f.laycan_from BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
    `

    for (const fixture of upcomingFixtures) {
      const daysUntilLaycan = Math.ceil(
        (new Date(fixture.laycan_from).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )
      const { subject, html } = generateLaycanAlertEmail(fixture, daysUntilLaycan)
      await sendEmail({ to: fixture.user_email, subject, html })
    }

    return NextResponse.json({
      success: true,
      invoiceReminders: upcomingInvoices.length,
      laycanAlerts: upcomingFixtures.length,
    })
  } catch (error) {
    return handleApiError(error, "Hatırlatma gönderimi")
  }
}
