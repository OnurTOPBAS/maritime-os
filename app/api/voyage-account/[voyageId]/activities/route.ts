import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { voyageId: string } }) {
  try {
    await requireAuth()
    const { voyageId } = params

    const activities = await sql`
      SELECT * FROM voyage_activities
      WHERE voyage_id = ${voyageId}
      ORDER BY created_at ASC
    `

    return NextResponse.json(activities)
  } catch (error) {
    console.error("[v0] Get voyage activities error:", error)
    return NextResponse.json({ error: "Failed to fetch voyage activities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { voyageId: string } }) {
  try {
    await requireAuth()
    const { voyageId } = params
    const body = await request.json()

    // Calculate fuel consumption: rate * days
    const foConsumption = (body.fo_rate || 0) * body.days
    const mgoConsumption = (body.mgo_rate || 0) * body.days

    const result = await sql`
      INSERT INTO voyage_activities (
        voyage_id, activity_type, activity_name, days, fo_rate, mgo_rate,
        fo_consumption, mgo_consumption, notes
      ) VALUES (
        ${voyageId}, ${body.activity_type}, ${body.activity_name || null}, ${body.days},
        ${body.fo_rate || 0}, ${body.mgo_rate || 0}, ${foConsumption}, ${mgoConsumption},
        ${body.notes || null}
      )
      RETURNING *
    `

    // Update voyage totals
    await updateVoyageTotals(voyageId)

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Create voyage activity error:", error)
    return NextResponse.json({ error: "Failed to create voyage activity" }, { status: 500 })
  }
}

async function updateVoyageTotals(voyageId: string) {
  // Calculate total days and fuel consumption
  const activities = await sql`
    SELECT 
      COALESCE(SUM(days), 0) as total_days,
      COALESCE(SUM(fo_consumption), 0) as total_fo,
      COALESCE(SUM(mgo_consumption), 0) as total_mgo
    FROM voyage_activities
    WHERE voyage_id = ${voyageId}
  `

  const { total_days, total_fo, total_mgo } = activities[0]

  // Get bunker prices
  const bunkerPrices = await sql`
    SELECT fo_price, mgo_price
    FROM voyage_bunker_prices
    WHERE voyage_id = ${voyageId}
    ORDER BY price_date DESC
    LIMIT 1
  `

  const foPrice = bunkerPrices[0]?.fo_price || 0
  const mgoPrice = bunkerPrices[0]?.mgo_price || 0
  const totalFuelCost = total_fo * foPrice + total_mgo * mgoPrice

  // Get voyage daily running cost
  const voyage = await sql`SELECT daily_running_cost FROM voyages WHERE id = ${voyageId}`
  const dailyRunningCost = voyage[0]?.daily_running_cost || 0
  const totalRunningCost = total_days * dailyRunningCost

  // Get total costs
  const costs = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_other_costs
    FROM voyage_cost_items
    WHERE voyage_id = ${voyageId}
  `

  const totalCost = totalFuelCost + totalRunningCost + Number(costs[0].total_other_costs)

  // Get total revenue
  const revenues = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_revenue
    FROM voyage_revenue_items
    WHERE voyage_id = ${voyageId}
  `

  const totalRevenue = Number(revenues[0].total_revenue)
  const netProfit = totalRevenue - totalCost

  // Update voyage
  await sql`
    UPDATE voyages
    SET total_days = ${total_days},
        total_fo_consumption = ${total_fo},
        total_mgo_consumption = ${total_mgo},
        total_fuel_cost = ${totalFuelCost},
        total_running_cost = ${totalRunningCost},
        total_cost = ${totalCost},
        total_revenue = ${totalRevenue},
        net_profit = ${netProfit},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${voyageId}
  `
}
