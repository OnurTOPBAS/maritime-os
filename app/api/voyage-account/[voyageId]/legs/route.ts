import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: NextRequest, { params }: { params: Promise<{ voyageId: string }> }) {
  try {
    const user = await requireAuth()
    const { voyageId } = await params
    await requireVoyageAccess(user.id, voyageId, "canView")

    const legs = await sql`
      SELECT * FROM voyage_legs
      WHERE voyage_id = ${voyageId}
      ORDER BY leg_order ASC
    `

    return NextResponse.json(legs)
  } catch (error) {
    return handleApiError(error, "Sefer bacakları")
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ voyageId: string }> }) {
  try {
    const user = await requireAuth()
    const { voyageId } = await params
    await requireVoyageAccess(user.id, voyageId, "canCreate")

    const body = await request.json()

    const existingLegs = await sql`
      SELECT COUNT(*) as count FROM voyage_legs WHERE voyage_id = ${voyageId}
    `
    const legOrder = Number(existingLegs[0]?.count || 0) + 1

    const voyage = await sql`SELECT service_speed FROM voyages WHERE id = ${voyageId}`
    const serviceSpeed = Number(voyage[0]?.service_speed) || 12

    const seaDays = body.distance_nm / (serviceSpeed * 24)

    const result = await sql`
      INSERT INTO voyage_legs (
        voyage_id, leg_order, leg_type, from_port, to_port, distance_nm, sea_days, notes
      ) VALUES (
        ${voyageId}, ${legOrder}, ${body.leg_type || "laden"}, ${body.from_port}, ${body.to_port},
        ${body.distance_nm}, ${seaDays}, ${body.notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Sefer bacağı oluşturma")
  }
}
