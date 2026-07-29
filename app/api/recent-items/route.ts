import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: request.headers,
    })

    if (!userRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await userRes.json()
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const recentItems = await sql(
      `
      SELECT * FROM recent_items 
      WHERE user_id = $1
      ORDER BY viewed_at DESC
      LIMIT $2
    `,
      [user.id, limit],
    )

    return NextResponse.json(recentItems)
  } catch (error) {
    console.error("Error fetching recent items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: request.headers,
    })

    if (!userRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await userRes.json()
    const { entityType, entityId, entityName } = await request.json()

    await sql(
      `
      INSERT INTO recent_items (user_id, entity_type, entity_id, entity_name, viewed_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, entity_type, entity_id) 
      DO UPDATE SET viewed_at = NOW(), entity_name = $4
    `,
      [user.id, entityType, entityId, entityName],
    )

    // Keep only last 50 items per user
    await sql(
      `
      DELETE FROM recent_items
      WHERE user_id = $1
      AND id NOT IN (
        SELECT id FROM recent_items
        WHERE user_id = $1
        ORDER BY viewed_at DESC
        LIMIT 50
      )
    `,
      [user.id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking recent item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
