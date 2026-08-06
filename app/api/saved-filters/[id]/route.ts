import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      DELETE FROM saved_filters
      WHERE id = ${(await params).id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting saved filter:", error)
    return NextResponse.json({ error: "Failed to delete filter" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, filters, isDefault } = await request.json()

    // If setting as default, get entity type first
    if (isDefault) {
      const existing = await sql`
        SELECT entity_type FROM saved_filters
        WHERE id = ${(await params).id} AND user_id = ${user.id}
      `
      if (existing.length > 0) {
        await sql`
          UPDATE saved_filters
          SET is_default = false
          WHERE user_id = ${user.id} AND entity_type = ${existing[0].entity_type}
        `
      }
    }

    const updated = await sql`
      UPDATE saved_filters
      SET name = ${name}, filters = ${JSON.stringify(filters)}, is_default = ${isDefault || false}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${(await params).id} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Error updating saved filter:", error)
    return NextResponse.json({ error: "Failed to update filter" }, { status: 500 })
  }
}
