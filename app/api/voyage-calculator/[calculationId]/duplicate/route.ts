import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { calculationId: string } }) {
  try {
    console.log("[v0] Duplicate request for calculation:", params.calculationId)

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const userId = userResult[0].id

    // Get original calculation
    const calcResult = await sql`
      SELECT * FROM voyage_calculations 
      WHERE id = ${params.calculationId} AND user_id = ${userId}
    `

    if (calcResult.length === 0) {
      console.log("[v0] Calculation not found:", params.calculationId)
      return NextResponse.json({ error: "Calculation not found" }, { status: 404 })
    }

    const original = calcResult[0]
    console.log("[v0] Original calculation found:", original.name)

    const newName = `${original.name} (Kopya)`

    const fuelConsumption = original.fuel_consumption || {}
    const operations = original.operations || {}

    console.log("[v0] Creating new calculation with name:", newName)

    const newCalc = await sql`
      INSERT INTO voyage_calculations (
        user_id, name, ship_id, ship_name, charterer, service_speed, running_cost_per_day,
        fo_price, mgo_price, total_days, total_fo_consumption,
        total_mgo_consumption, fuel_cost, running_cost, other_costs, total_cost, total_revenue, net_profit,
        status
      ) VALUES (
        ${userId}, ${newName}, ${original.ship_id}, ${original.ship_name}, ${original.charterer},
        ${original.service_speed || 0}, ${original.running_cost_per_day || 0},
        ${original.fo_price || 0}, ${original.mgo_price || 0}, 
        ${original.total_days || 0},
        ${original.total_fo_consumption || 0}, ${original.total_mgo_consumption || 0}, 
        ${original.fuel_cost || 0},
        ${original.running_cost || 0}, ${original.other_costs || 0}, ${original.total_cost || 0}, 
        ${original.total_revenue || 0},
        ${original.net_profit || 0}, 'draft'
      )
      RETURNING id
    `

    const newCalcId = newCalc[0].id
    console.log("[v0] New calculation created:", newCalcId)

    await sql`
      UPDATE voyage_calculations 
      SET fuel_consumption = ${JSON.stringify(fuelConsumption)}::jsonb,
          operations = ${JSON.stringify(operations)}::jsonb
      WHERE id = ${newCalcId}
    `
    console.log("[v0] JSONB fields updated")

    if (original.tags && Array.isArray(original.tags) && original.tags.length > 0) {
      await sql`UPDATE voyage_calculations SET tags = ${original.tags} WHERE id = ${newCalcId}`
      console.log("[v0] Tags copied:", original.tags)
    }

    // Copy legs
    const legs = await sql`SELECT * FROM voyage_calc_legs WHERE calculation_id = ${params.calculationId}`
    console.log("[v0] Copying", legs.length, "legs")
    for (const leg of legs) {
      await sql`
        INSERT INTO voyage_calc_legs (calculation_id, leg_order, from_port, to_port, distance_nm, condition, sea_days, fo_consumption, mgo_consumption)
        VALUES (${newCalcId}, ${leg.leg_order || 0}, ${leg.from_port}, ${leg.to_port}, ${leg.distance_nm || 0}, ${leg.condition}, ${leg.sea_days || 0}, ${leg.fo_consumption || 0}, ${leg.mgo_consumption || 0})
      `
    }

    // Copy costs
    const costs = await sql`SELECT * FROM voyage_calc_costs WHERE calculation_id = ${params.calculationId}`
    console.log("[v0] Copying", costs.length, "costs")
    for (const cost of costs) {
      await sql`
        INSERT INTO voyage_calc_costs (calculation_id, category, description, amount)
        VALUES (${newCalcId}, ${cost.category || ""}, ${cost.description || ""}, ${cost.amount || 0})
      `
    }

    // Copy revenues
    const revenues = await sql`SELECT * FROM voyage_calc_revenues WHERE calculation_id = ${params.calculationId}`
    console.log("[v0] Copying", revenues.length, "revenues")
    for (const revenue of revenues) {
      await sql`
        INSERT INTO voyage_calc_revenues (calculation_id, type, description, amount)
        VALUES (${newCalcId}, ${revenue.type || "freight"}, ${revenue.description || ""}, ${revenue.amount || 0})
      `
    }

    console.log("[v0] Duplicate completed successfully")
    return NextResponse.json({ id: newCalcId, message: "Calculation duplicated successfully" })
  } catch (error) {
    console.error("[v0] Duplicate calculation error:", error)
    console.error("[v0] Error details:", (error as Error).message)
    console.error("[v0] Error stack:", (error as Error).stack)
    return NextResponse.json(
      {
        error: "Failed to duplicate calculation",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
