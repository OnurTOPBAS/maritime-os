import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sql`
      SELECT * FROM user_certificate_preferences
      WHERE user_id = ${user.id}
    `

    if (result.length === 0) {
      // Return default preferences
      return NextResponse.json({
        view_mode: "table",
        sort_by: "certificate_name",
        sort_order: "asc",
      })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Get preferences error:", error)
    return NextResponse.json({ error: "Failed to get preferences" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { viewMode, sortBy, sortOrder } = body

    const result = await sql`
      INSERT INTO user_certificate_preferences (user_id, view_mode, sort_by, sort_order)
      VALUES (${user.id}, ${viewMode}, ${sortBy}, ${sortOrder})
      ON CONFLICT (user_id)
      DO UPDATE SET
        view_mode = ${viewMode},
        sort_by = ${sortBy},
        sort_order = ${sortOrder},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Save preferences error:", error)
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 })
  }
}
