import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { logActivity } from "@/lib/audit-logger"
import { sql } from "@/lib/db"
import { requireResourceAccess, resolveInvoiceCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params


    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveInvoiceCompany, id, "invoices", "view", "Fatura bulunamadı")

    const result = await sql`
      SELECT i.*, c.name as company_name
      FROM invoices i
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.id = ${id}
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 })
    }

    // Get payments for this invoice
    const payments = await sql`
      SELECT * FROM payments WHERE invoice_id = ${id} ORDER BY payment_date DESC
    `

    return NextResponse.json({ ...result[0], payments })
  } catch (error) {
    return handleApiError(error, "Fatura getirme")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const oldData = await sql`SELECT * FROM invoices WHERE id = ${id}`


    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveInvoiceCompany, id, "invoices", "edit", "Fatura bulunamadı")

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
  } catch (error) {
    return handleApiError(error, "Fatura güncelleme")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const oldData = await sql`SELECT * FROM invoices WHERE id = ${id}`


    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveInvoiceCompany, id, "invoices", "delete", "Fatura bulunamadı")

    await sql`DELETE FROM invoices WHERE id = ${id}`

    await logActivity({
      userId: user.id,
      entityType: "invoice",
      entityId: id,
      action: "delete",
      changes: { before: oldData[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Fatura silme")
  }
}
