import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; legId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, legId } = await params
    await requireVoyageAccess(user.id, voyageId, "canEdit")

    const body = await request.json()

    const voyage = await sql`SELECT service_speed FROM voyages WHERE id = ${voyageId}`
    const serviceSpeed = Number(voyage[0]?.service_speed) || 12

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

    if (result.length === 0) {
      return NextResponse.json({ error: "Bacak kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Sefer bacağı güncelleme")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; legId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, legId } = await params
    await requireVoyageAccess(user.id, voyageId, "canDelete")

    // voyage_id koşulu olmadan başka bir sefere ait bacak silinebilirdi.
    const result = await sql`
      DELETE FROM voyage_legs
      WHERE id = ${legId} AND voyage_id = ${voyageId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Bacak kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Sefer bacağı silme")
  }
}
