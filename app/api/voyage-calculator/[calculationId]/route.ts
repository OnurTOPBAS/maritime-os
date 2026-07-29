import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: { calculationId: string } }) {
  try {
    const user = await requireAuth()
    const { calculationId } = params

    const result = await sql`
      SELECT vc.* FROM voyage_calculations vc
      LEFT JOIN ships s ON vc.ship_id = s.id
      LEFT JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE vc.id = ${calculationId}
        AND (vc.user_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Calculation not found" }, { status: 404 })
    }

    const calc = result[0]

    // Fetch legs
    const legs = await sql`
      SELECT * FROM voyage_calc_legs
      WHERE calculation_id = ${calculationId}
      ORDER BY leg_order
    `

    const cost_items = await sql`
      SELECT * FROM voyage_calc_costs
      WHERE calculation_id = ${calculationId}
    `

    const revenue_items = await sql`
      SELECT * FROM voyage_calc_revenues
      WHERE calculation_id = ${calculationId}
    `

    // Parse numeric fields
    const parsedCalc = {
      ...calc,
      service_speed: calc.service_speed ? Number.parseFloat(calc.service_speed) : null,
      running_cost_per_day: calc.running_cost_per_day ? Number.parseFloat(calc.running_cost_per_day) : null,
      total_days: calc.total_days ? Number.parseFloat(calc.total_days) : null,
      total_fo_consumption: calc.total_fo_consumption ? Number.parseFloat(calc.total_fo_consumption) : null,
      total_mgo_consumption: calc.total_mgo_consumption ? Number.parseFloat(calc.total_mgo_consumption) : null,
      fo_price: calc.fo_price ? Number.parseFloat(calc.fo_price) : null,
      mgo_price: calc.mgo_price ? Number.parseFloat(calc.mgo_price) : null,
      fuel_cost: calc.fuel_cost ? Number.parseFloat(calc.fuel_cost) : null,
      running_cost: calc.running_cost ? Number.parseFloat(calc.running_cost) : null,
      other_costs: calc.other_costs ? Number.parseFloat(calc.other_costs) : null,
      total_cost: calc.total_cost ? Number.parseFloat(calc.total_cost) : null,
      total_revenue: calc.total_revenue ? Number.parseFloat(calc.total_revenue) : null,
      net_profit: calc.net_profit ? Number.parseFloat(calc.net_profit) : null,
      legs: legs.map((leg: any) => ({
        ...leg,
        distance_nm: leg.distance_nm ? Number.parseFloat(leg.distance_nm) : null,
        sea_days: leg.sea_days ? Number.parseFloat(leg.sea_days) : null,
        fo_consumption: leg.fo_consumption ? Number.parseFloat(leg.fo_consumption) : null,
        mgo_consumption: leg.mgo_consumption ? Number.parseFloat(leg.mgo_consumption) : null,
      })),
      cost_items: cost_items.map((item: any) => ({
        category: item.category,
        description: item.description || "",
        amount: item.amount ? Number.parseFloat(item.amount) : 0,
      })),
      revenue_items: revenue_items.map((item: any) => ({
        type: item.type,
        description: item.description || "",
        amount: item.amount ? Number.parseFloat(item.amount) : 0,
      })),
    }

    return NextResponse.json(parsedCalc)
  } catch (error) {
    console.error("[v0] Error fetching voyage calculation:", error)
    return NextResponse.json({ error: "Failed to fetch calculation" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { calculationId: string } }) {
  try {
    const user = await requireAuth()
    const { calculationId } = params
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

    const checkAccess = await sql`
      SELECT vc.id FROM voyage_calculations vc
      LEFT JOIN ships s ON vc.ship_id = s.id
      LEFT JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE vc.id = ${calculationId}
        AND (vc.user_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (checkAccess.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update calculation
    await sql`
      UPDATE voyage_calculations
      SET
        name = ${name},
        ship_id = ${ship_id || null},
        ship_name = ${ship_name},
        charterer = ${charterer || null},
        service_speed = ${service_speed || 0},
        running_cost_per_day = ${running_cost_per_day || 0},
        fuel_consumption = ${JSON.stringify(fuel_consumption || {})}::jsonb,
        fo_price = ${fo_price || 0},
        mgo_price = ${mgo_price || 0},
        operations = ${JSON.stringify(operations || {})}::jsonb,
        total_days = ${total_days || 0},
        total_fo_consumption = ${total_fo_consumption || 0},
        total_mgo_consumption = ${total_mgo_consumption || 0},
        fuel_cost = ${fuel_cost || 0},
        running_cost = ${running_cost || 0},
        other_costs = ${other_costs || 0},
        total_cost = ${total_cost || 0},
        total_revenue = ${total_revenue || 0},
        net_profit = ${net_profit || 0},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${calculationId}
    `

    // Delete existing legs, costs, revenues
    await sql`DELETE FROM voyage_calc_legs WHERE calculation_id = ${calculationId}`
    await sql`DELETE FROM voyage_calc_costs WHERE calculation_id = ${calculationId}`
    await sql`DELETE FROM voyage_calc_revenues WHERE calculation_id = ${calculationId}`

    // Insert new legs
    if (legs && legs.length > 0) {
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i]
        await sql`
          INSERT INTO voyage_calc_legs (
            calculation_id, leg_order, from_port, to_port, distance_nm, condition,
            sea_days, fo_consumption, mgo_consumption
          )
          VALUES (
            ${calculationId}, ${i + 1}, ${leg.from_port}, ${leg.to_port},
            ${leg.distance_nm || 0}, ${leg.condition}, ${leg.sea_days || 0},
            ${leg.fo_consumption || 0}, ${leg.mgo_consumption || 0}
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating voyage calculation:", error)
    return NextResponse.json({ error: "Failed to update calculation" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { calculationId: string } }) {
  try {
    const user = await requireAuth()
    const { calculationId } = params

    const checkAccess = await sql`
      SELECT vc.id FROM voyage_calculations vc
      LEFT JOIN ships s ON vc.ship_id = s.id
      LEFT JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN companies c ON f.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE vc.id = ${calculationId}
        AND (vc.user_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (checkAccess.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    await sql`
      DELETE FROM voyage_calculations
      WHERE id = ${calculationId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting voyage calculation:", error)
    return NextResponse.json({ error: "Failed to delete calculation" }, { status: 500 })
  }
}
