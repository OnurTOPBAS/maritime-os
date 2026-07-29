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
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const notifications = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    const unreadCount = await sql`
      SELECT COUNT(*)::int as count
      FROM notifications
      WHERE user_id = ${user.id} AND is_read = false
    `

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await sql`
        UPDATE notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id} AND is_read = false
      `
    } else if (notificationId) {
      await sql`
        UPDATE notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = ${notificationId} AND user_id = ${user.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
