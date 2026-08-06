import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const widgetId = searchParams.get("widgetId")

    if (!widgetId) {
      return NextResponse.json({ error: "Widget ID is required" }, { status: 400 })
    }

    const result = await sql`
      SELECT preferences 
      FROM widget_preferences 
      WHERE user_id = ${user.id} AND widget_id = ${widgetId}
    `

    if (result.length === 0) {
      return NextResponse.json({ preferences: {} })
    }

    return NextResponse.json({ preferences: result[0].preferences })
  } catch (error) {
    console.error("Error fetching widget preferences:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { widgetId, preferences } = body

    if (!widgetId || !preferences) {
      return NextResponse.json({ error: "Widget ID and preferences are required" }, { status: 400 })
    }

    await sql`
      INSERT INTO widget_preferences (user_id, widget_id, preferences, updated_at)
      VALUES (${user.id}, ${widgetId}, ${JSON.stringify(preferences)}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, widget_id) 
      DO UPDATE SET 
        preferences = ${JSON.stringify(preferences)},
        updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving widget preferences:", error)
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 })
  }
}
