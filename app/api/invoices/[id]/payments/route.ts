import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/db"
import { handleApiError } from "@/lib/api-error"


export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id: invoiceId } = await params
    const body = await request.json()

    // Verify invoice ownership
    const invoice = await sql`
      SELECT i.id FROM invoices i
      JOIN companies c ON i.company_id = c.id
      WHERE i.id = ${invoiceId} AND c.owner_id = ${user.id}
    `
    if (invoice.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const { paymentDate, amount, paymentMethod, referenceNumber, notes } = body

    const result = await sql`
      INSERT INTO payments (invoice_id, payment_date, amount, payment_method, reference_number, notes)
      VALUES (${invoiceId}, ${paymentDate}, ${amount}, ${paymentMethod || null}, ${referenceNumber || null}, ${notes || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "[v0] Error creating payment:")
  }
}
