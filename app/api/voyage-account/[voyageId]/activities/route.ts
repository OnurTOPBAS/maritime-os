import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { updateVoyageTotals } from "@/lib/voyage-totals"

export async function GET(request: NextRequest, { params }: { params: Promise<{ voyageId: string }> }) {
  try {
    const user = await requireAuth()
    const { voyageId } = await params
    await requireVoyageAccess(user.id, voyageId, "canView")

    const activities = await sql`
      SELECT * FROM voyage_activities
      WHERE voyage_id = ${voyageId}
      ORDER BY created_at ASC
    `

    return NextResponse.json(activities)
  } catch (error) {
    return handleApiError(error, "Sefer faaliyetleri")
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ voyageId: string }> }) {
  try {
    const user = await requireAuth()
    const { voyageId } = await params
    await requireVoyageAccess(user.id, voyageId, "canCreate")

    const body = await request.json()

    const foConsumption = (body.fo_rate || 0) * body.days
    const mgoConsumption = (body.mgo_rate || 0) * body.days

    const result = await sql`
      INSERT INTO voyage_activities (
        voyage_id, activity_type, activity_name, days, fo_rate, mgo_rate,
        fo_consumption, mgo_consumption, notes
      ) VALUES (
        ${voyageId}, ${body.activity_type}, ${body.activity_name || null}, ${body.days},
        ${body.fo_rate || 0}, ${body.mgo_rate || 0}, ${foConsumption}, ${mgoConsumption},
        ${body.notes || null}
      )
      RETURNING *
    `

    await updateVoyageTotals(voyageId)

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Sefer faaliyeti oluşturma")
  }
}
