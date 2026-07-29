import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { voyageId: string; activityId: string } }) {
  try {
    await requireAuth()
    const { voyageId, activityId } = params
    const body = await request.json()

    // Calculate fuel consumption
    const foConsumption = (body.fo_rate || 0) * body.days
    const mgoConsumption = (body.mgo_rate || 0) * body.days

    const result = await sql`
      UPDATE voyage_activities
      SET activity_type = ${body.activity_type},
          activity_name = ${body.activity_name || null},
          days = ${body.days},
          fo_rate = ${body.fo_rate || 0},
          mgo_rate = ${body.mgo_rate || 0},
          fo_consumption = ${foConsumption},
          mgo_consumption = ${mgoConsumption},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${activityId} AND voyage_id = ${voyageId}
      RETURNING *
    `

    // Update voyage totals
    await updateVoyageTotals(voyageId)

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update voyage activity error:", error)
    return NextResponse.json({ error: "Failed to update voyage activity" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { voyageId: string; activityId: string } }) {
  try {
    await requireAuth()
    const { voyageId, activityId } = params

    await sql`DELETE FROM voyage_activities WHERE id = ${activityId}`

    // Update voyage totals
    await updateVoyageTotals(voyageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete voyage activity error:", error)
    return NextResponse.json({ error: "Failed to delete voyage activity" }, { status: 500 })
  }
}

async function updateVoyageTotals(voyageId: string) {
  const activities = await sql`
    SELECT 
      COALESCE(SUM(days), 0) as total_days,
      COALESCE(SUM(fo_consumption), 0) as total_fo,
      COALESCE(SUM(mgo_consumption), 0) as total_mgo
    FROM voyage_activities
    WHERE voyage_id = ${voyageId}
  `

  const { total_days, total_fo, total_mgo } = activities[0]

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

  const voyage = await sql`SELECT daily_running_cost FROM voyages WHERE id = ${voyageId}`
  const dailyRunningCost = voyage[0]?.daily_running_cost || 0
  const totalRunningCost = total_days * dailyRunningCost

  const costs = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_other_costs
    FROM voyage_cost_items
    WHERE voyage_id = ${voyageId}
  `

  const totalCost = totalFuelCost + totalRunningCost + Number(costs[0].total_other_costs)

  const revenues = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_revenue
    FROM voyage_revenue_items
    WHERE voyage_id = ${voyageId}
  `

  const totalRevenue = Number(revenues[0].total_revenue)
  const netProfit = totalRevenue - totalCost

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
