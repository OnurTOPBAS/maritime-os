import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { voyageId: string; priceId: string } }) {
  try {
    await requireAuth()
    const { priceId } = params
    const body = await request.json()

    const result = await sql`
      UPDATE voyage_bunker_prices
      SET price_date = ${body.price_date},
          fo_price = ${body.fo_price},
          mgo_price = ${body.mgo_price},
          port = ${body.port || null},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${priceId}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update bunker price error:", error)
    return NextResponse.json({ error: "Failed to update bunker price" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { voyageId: string; priceId: string } }) {
  try {
    await requireAuth()
    const { priceId } = params

    await sql`DELETE FROM voyage_bunker_prices WHERE id = ${priceId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete bunker price error:", error)
    return NextResponse.json({ error: "Failed to delete bunker price" }, { status: 500 })
  }
}
