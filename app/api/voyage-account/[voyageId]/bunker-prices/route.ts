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

    const prices = await sql`
      SELECT * FROM voyage_bunker_prices
      WHERE voyage_id = ${voyageId}
      ORDER BY price_date DESC
    `

    return NextResponse.json(prices)
  } catch (error) {
    return handleApiError(error, "Yakıt fiyatları")
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ voyageId: string }> }) {
  try {
    const user = await requireAuth()
    const { voyageId } = await params
    await requireVoyageAccess(user.id, voyageId, "canCreate")

    const body = await request.json()

    const result = await sql`
      INSERT INTO voyage_bunker_prices (
        voyage_id, price_date, fo_price, mgo_price, port, notes
      ) VALUES (
        ${voyageId}, ${body.price_date}, ${body.fo_price}, ${body.mgo_price},
        ${body.port || null}, ${body.notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Yakıt fiyatı oluşturma")
  }
}
