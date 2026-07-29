// Email service for sending notifications
// In production, this should use a service like SendGrid, Resend, or AWS SES

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // For now, we'll log the email. In production, integrate with an email service
  console.log("[v0] Email would be sent:", { to, subject })

  // Example integration with a hypothetical email service:
  // const response = await fetch('https://api.emailservice.com/send', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${process.env.EMAIL_API_KEY}` },
  //   body: JSON.stringify({ to, subject, html })
  // })

  return { success: true, message: "Email queued for sending" }
}

export function generateInvoiceReminderEmail(invoice: any, daysUntilDue: number) {
  const subject = `Fatura Hatırlatması: ${invoice.invoice_number}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; }
          .button { background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fatura Hatırlatması</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>Aşağıdaki faturanızın ödeme tarihi ${daysUntilDue} gün sonra dolacaktır:</p>
            <ul>
              <li><strong>Fatura No:</strong> ${invoice.invoice_number}</li>
              <li><strong>Tutar:</strong> ${Number(invoice.amount).toLocaleString()} ${invoice.currency}</li>
              <li><strong>Vade Tarihi:</strong> ${new Date(invoice.due_date).toLocaleDateString("tr-TR")}</li>
            </ul>
            <p>Lütfen ödemenizi zamanında yapınız.</p>
          </div>
          <div class="footer">
            <p>Bu otomatik bir bildirimdir. Lütfen yanıtlamayın.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return { subject, html }
}

export function generateLaycanAlertEmail(fixture: any, daysUntilLaycan: number) {
  const subject = `Laycan Uyarısı: ${fixture.charterer}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Laycan Tarihi Yaklaşıyor</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>Aşağıdaki fixture'ın laycan tarihi ${daysUntilLaycan} gün sonra başlayacaktır:</p>
            <ul>
              <li><strong>Charterer:</strong> ${fixture.charterer}</li>
              <li><strong>Kargo:</strong> ${fixture.cargo_type}</li>
              <li><strong>Laycan:</strong> ${new Date(fixture.laycan_from).toLocaleDateString("tr-TR")} - ${new Date(fixture.laycan_to).toLocaleDateString("tr-TR")}</li>
              <li><strong>Yükleme Limanı:</strong> ${fixture.load_port}</li>
              <li><strong>Tahliye Limanı:</strong> ${fixture.discharge_port}</li>
            </ul>
            <p>Lütfen gerekli hazırlıkları yapınız.</p>
          </div>
          <div class="footer">
            <p>Bu otomatik bir bildirimdir. Lütfen yanıtlamayın.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return { subject, html }
}
