import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendEmail, generateInvoiceReminderEmail, generateLaycanAlertEmail } from "@/lib/email-service"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
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
      await sendEmail({
        to: invoice.user_email,
        subject,
        html,
      })
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
      await sendEmail({
        to: fixture.user_email,
        subject,
        html,
      })
    }

    return NextResponse.json({
      success: true,
      invoiceReminders: upcomingInvoices.length,
      laycanAlerts: upcomingFixtures.length,
    })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}
