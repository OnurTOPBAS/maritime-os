import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || user.id
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50

    const sessions = await sql`
      SELECT 
        id,
        user_id,
        ip_address,
        user_agent,
        created_at,
        expires_at,
        last_activity,
        is_active
      FROM user_sessions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching login history:", error)
    return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 })
  }
}
