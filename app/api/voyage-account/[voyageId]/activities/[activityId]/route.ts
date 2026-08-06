import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { updateVoyageTotals } from "@/lib/voyage-totals"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; activityId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, activityId } = await params
    await requireVoyageAccess(user.id, voyageId, "canEdit")

    const body = await request.json()

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

    if (result.length === 0) {
      return NextResponse.json({ error: "Faaliyet kaydı bulunamadı" }, { status: 404 })
    }

    await updateVoyageTotals(voyageId)

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Sefer faaliyeti güncelleme")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; activityId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, activityId } = await params
    await requireVoyageAccess(user.id, voyageId, "canDelete")

    // voyage_id koşulu olmadan başka bir sefere ait faaliyet silinebilirdi.
    const result = await sql`
      DELETE FROM voyage_activities
      WHERE id = ${activityId} AND voyage_id = ${voyageId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Faaliyet kaydı bulunamadı" }, { status: 404 })
    }

    await updateVoyageTotals(voyageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Sefer faaliyeti silme")
  }
}
