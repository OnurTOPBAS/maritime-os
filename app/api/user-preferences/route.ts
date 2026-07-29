import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching user preferences")

    const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: request.headers,
    })

    if (!userRes.ok) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await userRes.json()
    const user = userData.user

    console.log("[v0] User authenticated:", user?.id)

    if (!user || !user.id) {
      console.log("[v0] No user ID found")
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const preferences = await sql`
      SELECT * FROM user_preferences 
      WHERE user_id = ${user.id}
    `

    if (preferences.length === 0) {
      console.log("[v0] Creating default preferences for user:", user.id)
      // Create default preferences
      const newPrefs = await sql`
        INSERT INTO user_preferences (user_id)
        VALUES (${user.id})
        RETURNING *
      `
      return NextResponse.json(newPrefs[0])
    }

    console.log("[v0] Returning existing preferences")
    return NextResponse.json(preferences[0])
  } catch (error) {
    console.error("[v0] Error fetching user preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Updating user preferences")

    const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: request.headers,
    })

    if (!userRes.ok) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await userRes.json()
    const user = userData.user

    console.log("[v0] User authenticated:", user?.id)

    if (!user || !user.id) {
      console.log("[v0] No user ID found")
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const preferences = await request.json()
    console.log("[v0] Preferences to update:", preferences)

    const updated = await sql`
      INSERT INTO user_preferences (
        user_id, theme, language, timezone, date_format, time_format, 
        currency, notifications_enabled, email_notifications, push_notifications
      )
      VALUES (
        ${user.id},
        ${preferences.theme || "system"},
        ${preferences.language || "tr"},
        ${preferences.timezone || "Europe/Istanbul"},
        ${preferences.date_format || "DD/MM/YYYY"},
        ${preferences.time_format || "24h"},
        ${preferences.currency || "USD"},
        ${preferences.notifications_enabled !== false},
        ${preferences.email_notifications !== false},
        ${preferences.push_notifications || false}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        theme = ${preferences.theme || "system"},
        language = ${preferences.language || "tr"},
        timezone = ${preferences.timezone || "Europe/Istanbul"},
        date_format = ${preferences.date_format || "DD/MM/YYYY"},
        time_format = ${preferences.time_format || "24h"},
        currency = ${preferences.currency || "USD"},
        notifications_enabled = ${preferences.notifications_enabled !== false},
        email_notifications = ${preferences.email_notifications !== false},
        push_notifications = ${preferences.push_notifications || false},
        updated_at = NOW()
      RETURNING *
    `

    console.log("[v0] Preferences updated successfully")
    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("[v0] Error updating user preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
