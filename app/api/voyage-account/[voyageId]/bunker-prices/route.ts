import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { voyageId: string } }) {
  try {
    await requireAuth()
    const { voyageId } = params

    const prices = await sql`
      SELECT * FROM voyage_bunker_prices
      WHERE voyage_id = ${voyageId}
      ORDER BY price_date DESC
    `

    return NextResponse.json(prices)
  } catch (error) {
    console.error("[v0] Get bunker prices error:", error)
    return NextResponse.json({ error: "Failed to fetch bunker prices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { voyageId: string } }) {
  try {
    await requireAuth()
    const { voyageId } = params
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
    console.error("[v0] Create bunker price error:", error)
    return NextResponse.json({ error: "Failed to create bunker price" }, { status: 500 })
  }
}
