import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    let result

    if (companyId) {
      result = await sql`
        SELECT 
          f.name as fleet_name,
          COUNT(DISTINCT s.id) as total_ships,
          COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_ships,
          COUNT(DISTINCT CASE WHEN s.status = 'inactive' THEN s.id END) as inactive_ships,
          COUNT(DISTINCT fx.id) as total_fixtures,
          COUNT(DISTINCT v.id) as total_voyages,
          ROUND(
            (COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END)::numeric / 
            NULLIF(COUNT(DISTINCT s.id), 0) * 100), 2
          ) as utilization_rate
        FROM fleets f
        JOIN companies c ON f.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        LEFT JOIN ships s ON f.id = s.fleet_id
        LEFT JOIN fixtures fx ON s.id = fx.ship_id
        LEFT JOIN voyages v ON fx.id = v.fixture_id
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL) AND c.id = ${companyId}
        GROUP BY f.id, f.name
        ORDER BY f.name
      `
    } else {
      result = await sql`
        SELECT 
          f.name as fleet_name,
          c.name as company_name,
          COUNT(DISTINCT s.id) as total_ships,
          COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_ships,
          COUNT(DISTINCT CASE WHEN s.status = 'inactive' THEN s.id END) as inactive_ships,
          COUNT(DISTINCT fx.id) as total_fixtures,
          COUNT(DISTINCT v.id) as total_voyages,
          ROUND(
            (COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END)::numeric / 
            NULLIF(COUNT(DISTINCT s.id), 0) * 100), 2
          ) as utilization_rate
        FROM fleets f
        JOIN companies c ON f.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        LEFT JOIN ships s ON f.id = s.fleet_id
        LEFT JOIN fixtures fx ON s.id = fx.ship_id
        LEFT JOIN voyages v ON fx.id = v.fixture_id
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
        GROUP BY f.id, f.name, c.name
        ORDER BY c.name, f.name
      `
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Error fetching fleet utilization:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
