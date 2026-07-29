import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { voyageId: string; costId: string } }) {
  try {
    await requireAuth()
    const { costId } = params
    const body = await request.json()

    const result = await sql`
      UPDATE voyage_cost_items
      SET cost_type = ${body.cost_type},
          description = ${body.description || null},
          amount = ${body.amount},
          currency = ${body.currency || "USD"},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${costId}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update voyage cost error:", error)
    return NextResponse.json({ error: "Failed to update voyage cost" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { voyageId: string; costId: string } }) {
  try {
    await requireAuth()
    const { costId } = params

    await sql`DELETE FROM voyage_cost_items WHERE id = ${costId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete voyage cost error:", error)
    return NextResponse.json({ error: "Failed to delete voyage cost" }, { status: 500 })
  }
}
