import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

function parseNumericFields(obj: any) {
  const numericFields = [
    "total_days",
    "total_fo_consumption",
    "total_mgo_consumption",
    "total_fuel_cost",
    "total_running_cost",
    "total_other_costs",
    "total_cost",
    "total_revenue",
    "net_profit",
    "distance",
    "sea_days",
    "fo_consumption",
    "mgo_consumption",
    "amount",
    "fo_price",
    "mgo_price",
    "dwt",
  ]

  const parsed = { ...obj }
  for (const field of numericFields) {
    if (parsed[field] !== null && parsed[field] !== undefined) {
      parsed[field] = Number.parseFloat(parsed[field])
    }
  }
  return parsed
}

export async function GET(request: NextRequest, { params }: { params: { voyageId: string } }) {
  try {
    await requireAuth()
    const { voyageId } = params

    // Get voyage details with ship info
    const voyage = await sql`
      SELECT v.*, f.charterer, s.name as ship_name, s.imo_number, s.dwt
      FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      WHERE v.id = ${voyageId}
    `

    if (voyage.length === 0) {
      return NextResponse.json({ error: "Voyage not found" }, { status: 404 })
    }

    // Get all related data
    const [legs, activities, bunkerPrices, costs, revenues] = await Promise.all([
      sql`SELECT * FROM voyage_legs WHERE voyage_id = ${voyageId} ORDER BY leg_order`,
      sql`SELECT * FROM voyage_activities WHERE voyage_id = ${voyageId}`,
      sql`SELECT * FROM voyage_bunker_prices WHERE voyage_id = ${voyageId} ORDER BY price_date DESC`,
      sql`SELECT * FROM voyage_cost_items WHERE voyage_id = ${voyageId}`,
      sql`SELECT * FROM voyage_revenue_items WHERE voyage_id = ${voyageId}`,
    ])

    return NextResponse.json({
      voyage: parseNumericFields(voyage[0]),
      legs: legs.map(parseNumericFields),
      activities: activities.map(parseNumericFields),
      bunkerPrices: bunkerPrices.map(parseNumericFields),
      costs: costs.map(parseNumericFields),
      revenues: revenues.map(parseNumericFields),
    })
  } catch (error) {
    console.error("[v0] Get voyage summary error:", error)
    return NextResponse.json({ error: "Failed to fetch voyage summary" }, { status: 500 })
  }
}
