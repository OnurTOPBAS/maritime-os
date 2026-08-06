import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      // Count unread messages for the user
      const result = await sql`
        SELECT COUNT(*) as count
        FROM messages
        WHERE recipient_id = ${user.id}
        AND is_read = false
      `

      return NextResponse.json({ count: Number.parseInt(result[0]?.count || "0") })
    } catch (dbError: any) {
      console.error("[v0] Database error in unread count:", dbError?.message || dbError)

      // If it's a rate limit error, return 0 count instead of failing
      if (dbError?.message?.includes("Too Many Requests") || dbError?.message?.includes("rate limit")) {
        return NextResponse.json({ count: 0 })
      }

      // For other database errors, return 0 count
      return NextResponse.json({ count: 0 })
    }
  } catch (error) {
    console.error("[v0] Error fetching unread messages count:", error)
    return NextResponse.json({ count: 0 })
  }
}
