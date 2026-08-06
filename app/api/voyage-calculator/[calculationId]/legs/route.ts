import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCalculationOwner } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: NextRequest, { params }: { params: Promise<{ calculationId: string }> }) {
  try {
    const user = await requireAuth()
    const { calculationId } = await params
    await requireCalculationOwner(user.id, calculationId)

    const legs = await sql`
      SELECT 
        id,
        calculation_id,
        leg_order,
        from_port,
        to_port,
        distance_nm,
        leg_condition,
        sea_days,
        fo_consumption,
        mgo_consumption,
        created_at
      FROM voyage_calc_legs
      WHERE calculation_id = ${calculationId}
      ORDER BY leg_order ASC
    `

    // Parse numeric fields
    const parsedLegs = legs.map((leg: any) => ({
      ...leg,
      distance_nm: leg.distance_nm ? Number.parseFloat(leg.distance_nm) : null,
      sea_days: leg.sea_days ? Number.parseFloat(leg.sea_days) : null,
      fo_consumption: leg.fo_consumption ? Number.parseFloat(leg.fo_consumption) : null,
      mgo_consumption: leg.mgo_consumption ? Number.parseFloat(leg.mgo_consumption) : null,
    }))

    return NextResponse.json(parsedLegs)
  } catch (error) {
    return handleApiError(error, "Sefer bacakları")
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ calculationId: string }> }) {
  try {
    const user = await requireAuth()
    const { calculationId } = await params
    await requireCalculationOwner(user.id, calculationId)
    const body = await request.json()
    const { from_port, to_port, distance_nm, leg_condition } = body

    // Get the calculation to access service_speed
    const calcResult = await sql`
      SELECT service_speed FROM voyage_calculations WHERE id = ${calculationId}
    `

    if (calcResult.length === 0) {
      return NextResponse.json({ error: "Calculation not found" }, { status: 404 })
    }

    const serviceSpeed = Number.parseFloat(calcResult[0].service_speed)

    // Calculate sea days: distance / (speed * 24)
    const seaDays = serviceSpeed > 0 ? distance_nm / (serviceSpeed * 24) : 0

    // Get the next leg_order
    const orderResult = await sql`
      SELECT COALESCE(MAX(leg_order), 0) + 1 as next_order
      FROM voyage_calc_legs
      WHERE calculation_id = ${calculationId}
    `
    const legOrder = orderResult[0].next_order

    // Insert the leg
    const result = await sql`
      INSERT INTO voyage_calc_legs (
        calculation_id,
        leg_order,
        from_port,
        to_port,
        distance_nm,
        leg_condition,
        sea_days
      )
      VALUES (
        ${calculationId},
        ${legOrder},
        ${from_port},
        ${to_port},
        ${distance_nm},
        ${leg_condition},
        ${seaDays}
      )
      RETURNING *
    `

    // Update calculation totals
    await sql`
      UPDATE voyage_calculations
      SET
        total_distance_nm = (SELECT COALESCE(SUM(distance_nm), 0) FROM voyage_calc_legs WHERE calculation_id = ${calculationId}),
        total_sea_days = (SELECT COALESCE(SUM(sea_days), 0) FROM voyage_calc_legs WHERE calculation_id = ${calculationId}),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${calculationId}
    `

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Sefer bacakları")
  }
}
