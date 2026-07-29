import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await sql`
      SELECT * FROM dashboard_preferences
      WHERE user_id = ${user.id}
    `

    if (preferences.length === 0) {
      // Create default preferences
      const defaultPrefs = await sql`
        INSERT INTO dashboard_preferences (user_id)
        VALUES (${user.id})
        RETURNING *
      `
      return NextResponse.json(defaultPrefs[0])
    }

    return NextResponse.json(preferences[0])
  } catch (error) {
    console.error("Error fetching dashboard preferences:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { layoutType, visibleWidgets, widgetPositions, customLayouts } = await request.json()

    const updated = await sql`
      INSERT INTO dashboard_preferences (
        user_id, 
        layout_type,
        visible_widgets, 
        widget_positions,
        custom_layouts,
        updated_at
      )
      VALUES (
        ${user.id}, 
        ${layoutType || "grid-2col"},
        ${JSON.stringify(visibleWidgets || [])}, 
        ${JSON.stringify(widgetPositions || {})},
        ${JSON.stringify(customLayouts || [])},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        layout_type = ${layoutType || "grid-2col"},
        visible_widgets = ${JSON.stringify(visibleWidgets || [])},
        widget_positions = ${JSON.stringify(widgetPositions || {})},
        custom_layouts = ${JSON.stringify(customLayouts || [])},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Error updating dashboard preferences:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
