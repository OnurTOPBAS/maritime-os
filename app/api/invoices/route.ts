import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
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
  } catch (error: any) {
    console.error("Error fetching invoices:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Invoice POST request started")

    let user
    try {
      user = await requireAuth()
      console.log("[v0] User authenticated:", user.id)
    } catch (authError: any) {
      console.error("[v0] Authentication failed:", authError.message)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
      console.log("[v0] Invoice POST request body:", JSON.stringify(body, null, 2))
    } catch (parseError: any) {
      console.error("[v0] Failed to parse request body:", parseError.message)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!body.companyId) {
      console.log("[v0] Missing companyId in request")
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const validationErrors = validateInvoice(body)
    if (validationErrors.length > 0) {
      console.log("[v0] Validation errors:", validationErrors)
      return NextResponse.json({ errors: validationErrors }, { status: 400 })
    }
    console.log("[v0] Validation passed")

    const existingInvoice = await sql`
      SELECT id FROM invoices 
      WHERE invoice_number = ${body.invoiceNumber} AND company_id = ${body.companyId}
    `
    if (existingInvoice.length > 0) {
      console.log("[v0] Duplicate invoice number found")
      return NextResponse.json(
        { errors: [{ field: "invoiceNumber", message: "Bu fatura numarası zaten kullanılıyor" }] },
        { status: 400 },
      )
    }
    console.log("[v0] No duplicate invoice number")

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

    console.log("[v0] Checking company access for company:", companyId)
    const companies = await sql`
      SELECT c.id 
      FROM companies c
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE c.id = ${companyId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `
    console.log("[v0] Company access check result:", companies.length > 0 ? "Access granted" : "Access denied")

    if (companies.length === 0) {
      console.log("[v0] Company not found or user has no access")
      return NextResponse.json({ error: "Company not found or access denied" }, { status: 404 })
    }

    console.log("[v0] Inserting invoice with enhanced fields")

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

    console.log("[v0] Invoice inserted successfully:", result[0].id)

    await logActivity({
      userId: user.id,
      entityType: "invoice",
      entityId: result[0].id,
      action: "create",
      changes: { after: result[0] },
    })

    console.log("[v0] Activity logged, returning response")
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating invoice:", error)
    console.error("[v0] Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack,
    })
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
