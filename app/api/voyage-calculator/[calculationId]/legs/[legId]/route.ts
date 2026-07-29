import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { calculationId: string; legId: string } }) {
  try {
    const { calculationId, legId } = params
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

    // Calculate sea days
    const seaDays = serviceSpeed > 0 ? distance_nm / (serviceSpeed * 24) : 0

    // Update the leg
    const result = await sql`
      UPDATE voyage_calc_legs
      SET
        from_port = ${from_port},
        to_port = ${to_port},
        distance_nm = ${distance_nm},
        leg_condition = ${leg_condition},
        sea_days = ${seaDays}
      WHERE id = ${legId} AND calculation_id = ${calculationId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Leg not found" }, { status: 404 })
    }

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
    console.error("[v0] Error updating voyage leg:", error)
    return NextResponse.json({ error: "Failed to update leg" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { calculationId: string; legId: string } }) {
  try {
    const { calculationId, legId } = params

    await sql`
      DELETE FROM voyage_calc_legs
      WHERE id = ${legId} AND calculation_id = ${calculationId}
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting voyage leg:", error)
    return NextResponse.json({ error: "Failed to delete leg" }, { status: 500 })
  }
}
