import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = (await params).id

    const invoices = await sql`
      SELECT i.* FROM invoices i
      JOIN companies c ON i.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE i.id = ${invoiceId}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (invoices.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const original = invoices[0]

    const existingInvoices = await sql`
      SELECT invoice_number FROM invoices 
      WHERE company_id = ${original.company_id}
      AND invoice_number LIKE ${original.invoice_number + "-COPY%"}
      ORDER BY invoice_number DESC
    `

    let newInvoiceNumber = original.invoice_number + "-COPY"
    if (existingInvoices.length > 0) {
      // Find the highest copy number and increment
      const lastCopy = existingInvoices[0].invoice_number
      const match = lastCopy.match(/-COPY(\d+)$/)
      if (match) {
        const copyNum = Number.parseInt(match[1]) + 1
        newInvoiceNumber = original.invoice_number + "-COPY" + copyNum
      } else {
        newInvoiceNumber = original.invoice_number + "-COPY2"
      }
    }

    const newInvoices = await sql`
      INSERT INTO invoices (
        company_id, 
        fixture_id, 
        voyage_id, 
        invoice_number, 
        invoice_date, 
        due_date, 
        amount, 
        currency, 
        type, 
        status, 
        description, 
        notes
      ) VALUES (
        ${original.company_id},
        ${original.fixture_id},
        ${original.voyage_id},
        ${newInvoiceNumber},
        CURRENT_DATE,
        ${original.due_date},
        ${original.amount},
        ${original.currency},
        ${original.type},
        'pending',
        ${original.description ? original.description + " (Kopya)" : "(Kopya)"},
        ${original.notes}
      )
      RETURNING *
    `

    return NextResponse.json(newInvoices[0])
  } catch (error) {
    console.error("[v0] Copy invoice error:", error)
    return NextResponse.json({ error: "Failed to copy invoice" }, { status: 500 })
  }
}
