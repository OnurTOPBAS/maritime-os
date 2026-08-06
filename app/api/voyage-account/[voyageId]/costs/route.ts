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

    const costs = await sql`
      SELECT * FROM voyage_cost_items
      WHERE voyage_id = ${voyageId}
      ORDER BY created_at ASC
    `

    return NextResponse.json(costs)
  } catch (error) {
    return handleApiError(error, "Sefer maliyetleri")
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ voyageId: string }> }) {
  try {
    const user = await requireAuth()
    const { voyageId } = await params
    await requireVoyageAccess(user.id, voyageId, "canCreate")

    const body = await request.json()

    const result = await sql`
      INSERT INTO voyage_cost_items (
        voyage_id, cost_type, description, amount, currency, notes
      ) VALUES (
        ${voyageId}, ${body.cost_type}, ${body.description || null}, ${body.amount},
        ${body.currency || "USD"}, ${body.notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Sefer maliyeti oluşturma")
  }
}
