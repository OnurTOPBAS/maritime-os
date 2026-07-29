import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { voyageId: string; revenueId: string } }) {
  try {
    await requireAuth()
    const { revenueId } = params
    const body = await request.json()

    const result = await sql`
      UPDATE voyage_revenue_items
      SET revenue_type = ${body.revenue_type},
          description = ${body.description || null},
          amount = ${body.amount},
          currency = ${body.currency || "USD"},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${revenueId}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update voyage revenue error:", error)
    return NextResponse.json({ error: "Failed to update voyage revenue" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { voyageId: string; revenueId: string } }) {
  try {
    await requireAuth()
    const { revenueId } = params

    await sql`DELETE FROM voyage_revenue_items WHERE id = ${revenueId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete voyage revenue error:", error)
    return NextResponse.json({ error: "Failed to delete voyage revenue" }, { status: 500 })
  }
}
