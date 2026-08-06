import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; costId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, costId } = await params
    await requireVoyageAccess(user.id, voyageId, "canEdit")

    const body = await request.json()

    // WHERE koşulu voyage_id ile de sınırlanır: aksi halde erişimi olan bir
    // sefer üzerinden başka bir sefere ait maliyet kaydı güncellenebilirdi.
    const result = await sql`
      UPDATE voyage_cost_items
      SET cost_type = ${body.cost_type},
          description = ${body.description || null},
          amount = ${body.amount},
          currency = ${body.currency || "USD"},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${costId} AND voyage_id = ${voyageId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Maliyet kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Sefer maliyeti güncelleme")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; costId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, costId } = await params
    await requireVoyageAccess(user.id, voyageId, "canDelete")

    const result = await sql`
      DELETE FROM voyage_cost_items
      WHERE id = ${costId} AND voyage_id = ${voyageId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Maliyet kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Sefer maliyeti silme")
  }
}
