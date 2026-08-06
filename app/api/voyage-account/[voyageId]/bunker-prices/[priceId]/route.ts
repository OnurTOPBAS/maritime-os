import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireVoyageAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; priceId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, priceId } = await params
    await requireVoyageAccess(user.id, voyageId, "canEdit")

    const body = await request.json()

    const result = await sql`
      UPDATE voyage_bunker_prices
      SET price_date = ${body.price_date},
          fo_price = ${body.fo_price},
          mgo_price = ${body.mgo_price},
          port = ${body.port || null},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${priceId} AND voyage_id = ${voyageId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Yakıt fiyatı kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Yakıt fiyatı güncelleme")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ voyageId: string; priceId: string }> },
) {
  try {
    const user = await requireAuth()
    const { voyageId, priceId } = await params
    await requireVoyageAccess(user.id, voyageId, "canDelete")

    const result = await sql`
      DELETE FROM voyage_bunker_prices
      WHERE id = ${priceId} AND voyage_id = ${voyageId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Yakıt fiyatı kaydı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Yakıt fiyatı silme")
  }
}
