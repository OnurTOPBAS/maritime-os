import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (userId) {
      // Get specific user status
      const [status] = await sql`
        SELECT * FROM user_status WHERE user_id = ${userId}
      `
      return NextResponse.json({ status: status || { status: "offline" } })
    } else {
      // Get all user statuses
      const statuses = await sql`
        SELECT 
          us.*,
          u.name,
          u.email
        FROM user_status us
        JOIN users u ON us.user_id = u.id
        ORDER BY us.last_seen DESC
      `
      return NextResponse.json({ statuses })
    }
  } catch (error) {
    console.error("[v0] Error fetching user status:", error)
    return NextResponse.json({ error: "Failed to fetch user status" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, statusMessage } = body

    if (!status || !["online", "offline", "busy", "away"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await sql`
      INSERT INTO user_status (user_id, status, status_message, last_seen, updated_at)
      VALUES (${user.id}, ${status}, ${statusMessage || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        status = ${status},
        status_message = ${statusMessage || null},
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating user status:", error)
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
  }
}
