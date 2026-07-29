import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { voyageId: string; legId: string } }) {
  try {
    await requireAuth()
    const { voyageId, legId } = params
    const body = await request.json()

    // Get voyage service speed for calculation
    const voyage = await sql`SELECT service_speed FROM voyages WHERE id = ${voyageId}`
    const serviceSpeed = voyage[0]?.service_speed || 12

    // Calculate sea days
    const seaDays = body.distance_nm / (serviceSpeed * 24)

    const result = await sql`
      UPDATE voyage_legs
      SET leg_order = ${body.leg_order},
          leg_type = ${body.leg_type},
          from_port = ${body.from_port},
          to_port = ${body.to_port},
          distance_nm = ${body.distance_nm},
          sea_days = ${seaDays},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${legId} AND voyage_id = ${voyageId}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update voyage leg error:", error)
    return NextResponse.json({ error: "Failed to update voyage leg" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { voyageId: string; legId: string } }) {
  try {
    await requireAuth()
    const { legId } = params

    await sql`DELETE FROM voyage_legs WHERE id = ${legId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete voyage leg error:", error)
    return NextResponse.json({ error: "Failed to delete voyage leg" }, { status: 500 })
  }
}
