import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verify ownership through company
    const fleets = await sql`
      SELECT f.id FROM fleets f
      JOIN companies c ON f.company_id = c.id
      WHERE f.id = ${id} AND c.owner_id = ${user.id}
    `

    if (fleets.length === 0) {
      return NextResponse.json({ error: "Fleet not found" }, { status: 404 })
    }

    await sql`DELETE FROM fleets WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete fleet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
