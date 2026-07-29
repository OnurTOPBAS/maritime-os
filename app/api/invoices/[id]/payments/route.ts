import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const { id: invoiceId } = params
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
  } catch (error: any) {
    console.error("[v0] Error creating payment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
