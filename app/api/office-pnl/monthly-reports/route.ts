import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch reports with calculated totals from office_pnl records
    const reports = await sql`
      SELECT 
        r.id,
        r.report_month,
        r.is_closed,
        r.notes,
        r.created_at,
        COALESCE(SUM(CASE WHEN p.type = 'income' THEN p.price_usd ELSE 0 END), 0) as total_income_usd,
        COALESCE(SUM(CASE WHEN p.type = 'expense' THEN p.price_usd ELSE 0 END), 0) as total_expense_usd,
        COALESCE(SUM(CASE WHEN p.type = 'income' THEN p.price_tl ELSE 0 END), 0) as total_income_tl,
        COALESCE(SUM(CASE WHEN p.type = 'expense' THEN p.price_tl ELSE 0 END), 0) as total_expense_tl
      FROM office_monthly_reports r
      LEFT JOIN office_pnl p ON p.report_month = r.report_month
      GROUP BY r.id, r.report_month, r.is_closed, r.notes, r.created_at
      ORDER BY r.report_month DESC
    `

    // Map is_closed to status for UI compatibility
    const mapped = reports.map((r: any) => ({
      ...r,
      status: r.is_closed ? "closed" : "open",
    }))

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error("Error fetching monthly reports:", error.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportMonth, notes } = body

    if (!reportMonth) {
      return NextResponse.json({ error: "reportMonth is required" }, { status: 400 })
    }

    // Check if report already exists
    const existing = await sql`
      SELECT id FROM office_monthly_reports WHERE report_month = ${reportMonth}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Bu ay için rapor zaten mevcut" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO office_monthly_reports (report_month, notes)
      VALUES (${reportMonth}, ${notes || null})
      RETURNING *
    `

    return NextResponse.json({ ...result[0], status: "open" })
  } catch (error: any) {
    console.error("Error creating monthly report:", error.message)
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 })
  }
}
