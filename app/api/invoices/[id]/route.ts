import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"
import { logActivity } from "@/lib/audit-logger"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const { id } = params

    const result = await sql`
      SELECT i.*, 
        c.name as company_name,
        f.fixture_ref as fixture_ref,
        v.voyage_number as voyage_number
      FROM invoices i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      LEFT JOIN fixtures f ON i.fixture_id = f.id
      LEFT JOIN voyages v ON i.voyage_id = v.id
      WHERE i.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get payments for this invoice
    const payments = await sql`
      SELECT * FROM payments WHERE invoice_id = ${id} ORDER BY payment_date DESC
    `

    return NextResponse.json({ ...result[0], payments })
  } catch (error: any) {
    console.error("[v0] Error fetching invoice:", error)
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const { id } = params
    const body = await request.json()

    const oldData = await sql`SELECT * FROM invoices WHERE id = ${id}`

    const existing = await sql`
      SELECT i.id FROM invoices i
      JOIN companies c ON i.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE i.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const {
      fixtureId,
      voyageId,
      invoiceNumber,
      invoiceType,
      shipName,
      charterer,
      invoiceDate,
      dueDate,
      freightGrossUsd,
      freightNetUsd,
      usdAedRate,
      freightNetAed,
      brokerCommission,
      brokerCommissionStatus,
      amount,
      currency,
      type,
      status,
      description,
      notes,
    } = body

    const result = await sql`
      UPDATE invoices SET
        fixture_id = ${fixtureId || null},
        voyage_id = ${voyageId || null},
        invoice_number = ${invoiceNumber},
        invoice_type = ${invoiceType || null},
        ship_name = ${shipName || null},
        charterer = ${charterer || null},
        invoice_date = ${invoiceDate},
        due_date = ${dueDate || null},
        freight_gross_usd = ${freightGrossUsd || null},
        freight_net_usd = ${freightNetUsd || null},
        usd_aed_rate = ${usdAedRate || 3.6725},
        freight_net_aed = ${freightNetAed || null},
        broker_commission = ${brokerCommission || null},
        broker_commission_status = ${brokerCommissionStatus || "pending"},
        amount = ${amount},
        currency = ${currency},
        type = ${type},
        status = ${status},
        description = ${description || null},
        notes = ${notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    await logActivity({
      userId: user.id,
      entityType: "invoice",
      entityId: id,
      action: "update",
      changes: { before: oldData[0], after: result[0] },
    })

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Error updating invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const { id } = params

    const oldData = await sql`SELECT * FROM invoices WHERE id = ${id}`

    const existing = await sql`
      SELECT i.id FROM invoices i
      JOIN companies c ON i.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE i.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    await sql`DELETE FROM invoices WHERE id = ${id}`

    await logActivity({
      userId: user.id,
      entityType: "invoice",
      entityId: id,
      action: "delete",
      changes: { before: oldData[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
