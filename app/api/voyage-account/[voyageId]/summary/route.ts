import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ voyageId: string }> }) {
  try {
    const user = await requireAuth()
    const { voyageId } = await params

    // Sefer özeti tüm mali verileri (gelir, maliyet, kâr) içerir;
    // erişim kontrolü olmadan başka şirketin karlılığı görülebilirdi.
    await requireVoyageAccess(user.id, voyageId, "canView")

    const voyage = await sql`
      SELECT v.*, f.charterer, s.name as ship_name, s.imo_number, s.dwt
      FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      WHERE v.id = ${voyageId}
    `

    if (voyage.length === 0) {
      return NextResponse.json({ error: "Sefer bulunamadı" }, { status: 404 })
    }

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
    return handleApiError(error, "Sefer özeti")
  }
}
