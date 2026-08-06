import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")


    if (!query || query.trim().length < 2) {
      return NextResponse.json([])
    }

    const searchTerm = `%${query.toLowerCase()}%`

    const [companies, fleets, ships, fixtures, voyages, invoices] = await Promise.all([
      sql`
        SELECT c.id, c.name, c.email
        FROM companies c
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND (LOWER(c.name) LIKE ${searchTerm} OR LOWER(c.email) LIKE ${searchTerm})
        LIMIT 5
      `.catch(() => []),
      sql`
        SELECT f.id, f.name, c.name as company_name
        FROM fleets f
        JOIN companies c ON f.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND LOWER(f.name) LIKE ${searchTerm}
        LIMIT 5
      `.catch(() => []),
      sql`
        SELECT s.id, s.name, s.imo_number, s.flag, f.name as fleet_name
        FROM ships s
        JOIN fleets f ON s.fleet_id = f.id
        JOIN companies c ON f.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND (LOWER(s.name) LIKE ${searchTerm} OR LOWER(s.imo_number) LIKE ${searchTerm})
        LIMIT 5
      `.catch(() => []),
      sql`
        SELECT fx.id, fx.charterer, fx.cargo_type, fx.load_port, fx.discharge_port, s.name as ship_name
        FROM fixtures fx
        LEFT JOIN ships s ON fx.ship_id = s.id
        LEFT JOIN fleets fl ON s.fleet_id = fl.id
        LEFT JOIN companies c ON fl.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND (LOWER(fx.charterer) LIKE ${searchTerm} OR LOWER(fx.cargo_type) LIKE ${searchTerm})
        LIMIT 5
      `.catch(() => []),
      sql`
        SELECT v.id, v.voyage_number, s.name as ship_name, v.load_port, v.discharge_port
        FROM voyages v
        JOIN fixtures fx ON v.fixture_id = fx.id
        LEFT JOIN ships s ON fx.ship_id = s.id
        LEFT JOIN fleets fl ON s.fleet_id = fl.id
        LEFT JOIN companies c ON fl.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND (LOWER(v.voyage_number) LIKE ${searchTerm} OR LOWER(s.name) LIKE ${searchTerm})
        LIMIT 5
      `.catch(() => []),
      sql`
        SELECT i.id, i.invoice_number, i.amount, i.type, i.status
        FROM invoices i
        JOIN companies c ON i.company_id = c.id
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
          AND LOWER(i.invoice_number) LIKE ${searchTerm}
        LIMIT 5
      `.catch(() => []),
    ])

    const results = [
      ...companies.map((c: any) => ({
        id: c.id,
        type: "company",
        name: c.name,
        description: c.email,
        url: `/dashboard/companies/${c.id}`,
      })),
      ...ships.map((s: any) => ({
        id: s.id,
        type: "ship",
        name: s.name,
        description: `${s.imo_number} • ${s.fleet_name}`,
        url: `/dashboard/ships/${s.id}`,
      })),
      ...fixtures.map((f: any) => ({
        id: f.id,
        type: "fixture",
        name: f.charterer,
        description: `${f.ship_name} • ${f.load_port} → ${f.discharge_port}`,
        url: `/dashboard/fixtures/${f.id}`,
      })),
      ...voyages.map((v: any) => ({
        id: v.id,
        type: "voyage",
        name: v.voyage_number,
        description: `${v.ship_name} • ${v.load_port} → ${v.discharge_port}`,
        url: `/dashboard/voyage-account/${v.id}`,
      })),
      ...invoices.map((i: any) => ({
        id: i.id,
        type: "invoice",
        name: i.invoice_number,
        description: `${i.type} • $${i.amount}`,
        url: `/dashboard/invoices/${i.id}`,
      })),
    ]

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
