import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; revenueId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, revenueId } = await params
    await requireVoyageAccess(user.id, voyageId, "canEdit")

    const body = await request.json()

    const result = await sql`
      UPDATE voyage_revenue_items
      SET revenue_type = ${body.revenue_type},
          description = ${body.description || null},
          amount = ${body.amount},
          currency = ${body.currency || "USD"},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${revenueId} AND voyage_id = ${voyageId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Gelir kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Sefer geliri güncelleme")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; revenueId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, revenueId } = await params
    await requireVoyageAccess(user.id, voyageId, "canDelete")

    const result = await sql`
      DELETE FROM voyage_revenue_items
      WHERE id = ${revenueId} AND voyage_id = ${voyageId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Gelir kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Sefer geliri silme")
  }
}
