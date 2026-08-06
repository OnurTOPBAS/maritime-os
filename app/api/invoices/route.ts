import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireModuleAccess, getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { logActivity } from "@/lib/audit-logger"
import { validateInvoice } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const shipId = searchParams.get("shipId")
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    if (shipId) {
      const result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN ships s ON f.ship_id = s.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND s.id = ${shipId}
        ORDER BY i.invoice_date DESC
      `
      return NextResponse.json(result || [])
    }

    let result

    if (!companyId && !type && !status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    } else if (companyId && !type && !status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND i.company_id = ${companyId}
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    } else if (companyId && type && !status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND i.company_id = ${companyId} AND i.type = ${type}
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    } else if (companyId && type && status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND i.company_id = ${companyId} AND i.type = ${type} AND i.status = ${status}
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    } else if (companyId && !type && status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND i.company_id = ${companyId} AND i.status = ${status}
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    } else if (!companyId && type && !status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND i.type = ${type}
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    } else if (!companyId && type && status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND i.type = ${type} AND i.status = ${status}
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    } else if (!companyId && !type && status) {
      result = await sql`
        SELECT DISTINCT i.*, 
          c.name as company_name,
          f.charterer as fixture_ref,
          v.voyage_number as voyage_number,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM invoices i
        LEFT JOIN companies c ON i.company_id = c.id
        LEFT JOIN fixtures f ON i.fixture_id = f.id
        LEFT JOIN voyages v ON i.voyage_id = v.id
        LEFT JOIN payments p ON i.id = p.invoice_id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) 
          AND i.status = ${status}
        GROUP BY i.id, c.name, f.charterer, v.voyage_number 
        ORDER BY i.invoice_date DESC
      `
    }

    return NextResponse.json(result || [])
  } catch (error) {
    return handleApiError(error, "Fatura listesi")
  }
}

export async function POST(request: NextRequest) {
  try {

    let user
    try {
      user = await requireAuth()
    } catch (authError: any) {
      console.error("[v0] Authentication failed:", authError.message)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error("[v0] Failed to parse request body:", parseError.message)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!body.companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const validationErrors = validateInvoice(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 })
    }

    const existingInvoice = await sql`
      SELECT id FROM invoices 
      WHERE invoice_number = ${body.invoiceNumber} AND company_id = ${body.companyId}
    `
    if (existingInvoice.length > 0) {
      return NextResponse.json(
        { errors: [{ field: "invoiceNumber", message: "Bu fatura numarası zaten kullanılıyor" }] },
        { status: 400 },
      )
    }

    const {
      companyId,
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

    // Fatura oluşturmak için "invoices" modülünde yazma yetkisi gerekir.
    // Önceki kontrol yalnızca company_team_members üyeliğine bakıyordu:
    //  - user_permissions'a eklenen üyeler hiç tanınmıyordu (404),
    //  - rol ayrımı yapılmadığı için viewer bile fatura oluşturabiliyordu.
    await requireModuleAccess(user.id, companyId, "invoices", "create")


    const result = await sql`
      INSERT INTO invoices (
        company_id, fixture_id, voyage_id, invoice_number, invoice_type,
        ship_name, charterer, invoice_date, due_date, 
        freight_gross_usd, freight_net_usd, usd_aed_rate, freight_net_aed,
        broker_commission, broker_commission_status,
        amount, currency, type, status, description, notes
      )
      VALUES (
        ${companyId}, ${fixtureId || null}, ${voyageId || null}, ${invoiceNumber}, ${invoiceType || null},
        ${shipName || null}, ${charterer || null}, ${invoiceDate}, ${dueDate || null},
        ${freightGrossUsd || null}, ${freightNetUsd || null}, ${usdAedRate || 3.6725}, ${freightNetAed || null},
        ${brokerCommission || null}, ${brokerCommissionStatus || "pending"},
        ${amount}, ${currency || "USD"}, ${type}, ${status || "pending"}, 
        ${description || null}, ${notes || null}
      )
      RETURNING *
    `


    await logActivity({
      userId: user.id,
      entityType: "invoice",
      entityId: result[0].id,
      action: "create",
      changes: { after: result[0] },
    })

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    // handleApiError yetki hatasını 403'e çevirir; önceki kod her hatayı
    // 500 yapıyor ve iç hata mesajını istemciye sızdırıyordu.
    return handleApiError(error, "Fatura oluşturma")
  }
}
