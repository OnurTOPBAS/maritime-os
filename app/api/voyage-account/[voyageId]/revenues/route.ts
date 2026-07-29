import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { voyageId: string } }) {
  try {
    await requireAuth()
    const { voyageId } = params

    const revenues = await sql`
      SELECT * FROM voyage_revenue_items
      WHERE voyage_id = ${voyageId}
      ORDER BY created_at ASC
    `

    return NextResponse.json(revenues)
  } catch (error) {
    console.error("[v0] Get voyage revenues error:", error)
    return NextResponse.json({ error: "Failed to fetch voyage revenues" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { voyageId: string } }) {
  try {
    await requireAuth()
    const { voyageId } = params
    const body = await request.json()

    const result = await sql`
      INSERT INTO voyage_revenue_items (
        voyage_id, revenue_type, description, amount, currency, notes
      ) VALUES (
        ${voyageId}, ${body.revenue_type}, ${body.description || null}, ${body.amount},
        ${body.currency || "USD"}, ${body.notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Create voyage revenue error:", error)
    return NextResponse.json({ error: "Failed to create voyage revenue" }, { status: 500 })
  }
}
