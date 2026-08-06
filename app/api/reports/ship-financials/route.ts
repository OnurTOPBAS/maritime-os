import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    const query = companyId
      ? sql`
          SELECT 
            s.id as ship_id,
            s.name as ship_name,
            s.imo_number,
            s.vessel_type,
            COUNT(DISTINCT f.id) as fixture_count,
            COUNT(DISTINCT i.id) as invoice_count,
            COALESCE(SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END), 0) as total_expense,
            COALESCE(SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END), 0) - 
            COALESCE(SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END), 0) as net_profit
          FROM ships s
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          LEFT JOIN fixtures f ON s.id = f.ship_id
          LEFT JOIN invoices i ON f.id = i.fixture_id
          WHERE c.id = ${companyId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          GROUP BY s.id, s.name, s.imo_number, s.vessel_type
          ORDER BY net_profit DESC
        `
      : sql`
          SELECT 
            s.id as ship_id,
            s.name as ship_name,
            s.imo_number,
            s.vessel_type,
            c.name as company_name,
            COUNT(DISTINCT f.id) as fixture_count,
            COUNT(DISTINCT i.id) as invoice_count,
            COALESCE(SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END), 0) as total_expense,
            COALESCE(SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END), 0) - 
            COALESCE(SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END), 0) as net_profit
          FROM ships s
          JOIN fleets fl ON s.fleet_id = fl.id
          JOIN companies c ON fl.company_id = c.id
          LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
          LEFT JOIN fixtures f ON s.id = f.ship_id
          LEFT JOIN invoices i ON f.id = i.fixture_id
          WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          GROUP BY s.id, s.name, s.imo_number, s.vessel_type, c.name
          ORDER BY net_profit DESC
        `

    const result = await query

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, "[v0] Error fetching ship financials:")
  }
}
