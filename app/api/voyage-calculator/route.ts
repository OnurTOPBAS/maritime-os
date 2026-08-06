import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const calculations = await sql`
      SELECT DISTINCT
        vc.id,
        vc.name,
        vc.ship_id,
        vc.ship_name,
        vc.charterer,
        vc.service_speed,
        vc.running_cost_per_day,
        vc.total_days,
        vc.fuel_cost,
        vc.running_cost,
        vc.other_costs,
        vc.total_cost,
        vc.total_revenue,
        vc.net_profit,
        vc.created_at,
        vc.updated_at
      FROM voyage_calculations vc
      LEFT JOIN ships s ON vc.ship_id = s.id
      LEFT JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE vc.user_id = ${user.id} 
         OR c.owner_id = ${user.id}
         OR ctm.user_id IS NOT NULL
      ORDER BY vc.created_at DESC
    `

    const calculationsWithLegs = await Promise.all(
      calculations.map(async (calc: any) => {
        const legs = await sql`
          SELECT from_port, to_port, condition
          FROM voyage_calc_legs
          WHERE calculation_id = ${calc.id}
          ORDER BY leg_order
        `

        return {
          ...calc,
          legs: legs || [],
        }
      }),
    )

    const parsedCalculations = calculationsWithLegs.map((calc: any) => ({
      ...calc,
      service_speed: calc.service_speed ? Number.parseFloat(calc.service_speed) : null,
      running_cost_per_day: calc.running_cost_per_day ? Number.parseFloat(calc.running_cost_per_day) : null,
      total_days: calc.total_days ? Number.parseFloat(calc.total_days) : null,
      fuel_cost: calc.fuel_cost ? Number.parseFloat(calc.fuel_cost) : 0,
      running_cost: calc.running_cost ? Number.parseFloat(calc.running_cost) : 0,
      other_costs: calc.other_costs ? Number.parseFloat(calc.other_costs) : 0,
      total_cost: calc.total_cost ? Number.parseFloat(calc.total_cost) : null,
      total_revenue: calc.total_revenue ? Number.parseFloat(calc.total_revenue) : null,
      net_profit: calc.net_profit ? Number.parseFloat(calc.net_profit) : null,
    }))

    return NextResponse.json(parsedCalculations)
  } catch (error: any) {
    console.error("[v0] Error fetching voyage calculations:", error)

    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {

      try {
        await fetch(new URL("/api/voyage-calculator/init", request.url), {
          method: "POST",
        })
        return NextResponse.json([])
      } catch (initError) {
        console.error("[v0] Auto-init failed:", initError)
      }
    }

    return NextResponse.json({ error: "Failed to fetch calculations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      name,
      ship_id,
      ship_name,
      charterer,
      service_speed,
      running_cost_per_day,
      fuel_consumption,
      fo_price,
      mgo_price,
      operations,
      cost_items,
      revenue_items,
      total_days,
      total_fo_consumption,
      total_mgo_consumption,
      fuel_cost,
      running_cost,
      other_costs,
      total_cost,
      total_revenue,
      net_profit,
      legs,
    } = body

    // Insert calculation
    const result = await sql`
      INSERT INTO voyage_calculations (
        user_id,
        name,
        ship_id,
        ship_name,
        charterer,
        service_speed,
        running_cost_per_day,
        fuel_consumption,
        fo_price,
        mgo_price,
        operations,
        total_days,
        total_fo_consumption,
        total_mgo_consumption,
        fuel_cost,
        running_cost,
        other_costs,
        total_cost,
        total_revenue,
        net_profit
      )
      VALUES (
        ${user.id},
        ${name},
        ${ship_id || null},
        ${ship_name},
        ${charterer || null},
        ${service_speed || 0},
        ${running_cost_per_day || 0},
        ${JSON.stringify(fuel_consumption || {})}::jsonb,
        ${fo_price || 0},
        ${mgo_price || 0},
        ${JSON.stringify(operations || {})}::jsonb,
        ${total_days || 0},
        ${total_fo_consumption || 0},
        ${total_mgo_consumption || 0},
        ${fuel_cost || 0},
        ${running_cost || 0},
        ${other_costs || 0},
        ${total_cost || 0},
        ${total_revenue || 0},
        ${net_profit || 0}
      )
      RETURNING id
    `

    const calculationId = result[0].id

    if (legs && legs.length > 0) {
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i]
        await sql`
          INSERT INTO voyage_calc_legs (
            calculation_id,
            leg_order,
            from_port,
            to_port,
            distance_nm,
            condition,
            sea_days,
            fo_consumption,
            mgo_consumption
          )
          VALUES (
            ${calculationId},
            ${i + 1},
            ${leg.from_port},
            ${leg.to_port},
            ${leg.distance_nm || 0},
            ${leg.condition},
            ${leg.sea_days || 0},
            ${leg.fo_consumption || 0},
            ${leg.mgo_consumption || 0}
          )
        `
      }
    }

    if (cost_items && cost_items.length > 0) {
      for (const item of cost_items) {
        await sql`
          INSERT INTO voyage_calc_costs (calculation_id, category, description, amount)
          VALUES (${calculationId}, ${item.category}, ${item.description || ""}, ${item.amount || 0})
        `
      }
    }

    if (revenue_items && revenue_items.length > 0) {
      for (const item of revenue_items) {
        await sql`
          INSERT INTO voyage_calc_revenues (calculation_id, type, description, amount)
          VALUES (${calculationId}, ${item.type}, ${item.description || ""}, ${item.amount || 0})
        `
      }
    }

    return NextResponse.json({ id: calculationId }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating voyage calculation:", error)
    return NextResponse.json({ error: "Failed to create calculation" }, { status: 500 })
  }
}
