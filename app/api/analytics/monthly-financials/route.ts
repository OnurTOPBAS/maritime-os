import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const months = Number.parseInt(searchParams.get("months") || "12")

    let result

    if (companyId) {
      result = await sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', i.invoice_date), 'YYYY-MM') as month,
          SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END) as income,
          SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END) as expense,
          SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE -i.amount END) as net
        FROM invoices i
        JOIN companies c ON i.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND i.company_id = ${companyId}
          AND i.invoice_date >= CURRENT_DATE - (INTERVAL '1 month' * ${months})
        GROUP BY DATE_TRUNC('month', i.invoice_date)
        ORDER BY month DESC
      `
    } else {
      result = await sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', i.invoice_date), 'YYYY-MM') as month,
          SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END) as income,
          SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END) as expense,
          SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE -i.amount END) as net
        FROM invoices i
        JOIN companies c ON i.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND i.invoice_date >= CURRENT_DATE - (INTERVAL '1 month' * ${months})
        GROUP BY DATE_TRUNC('month', i.invoice_date)
        ORDER BY month DESC
      `
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Error fetching monthly financials:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
