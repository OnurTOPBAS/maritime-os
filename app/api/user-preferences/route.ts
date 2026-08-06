import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

/**
 * Kullanıcı tercihleri (tema, dil, saat dilimi vb.).
 *
 * Bu rota da kullanıcıyı öğrenmek için kendi /api/auth/me uç noktasına HTTP
 * isteği atıyordu; oturum artık doğrudan okunuyor. Ayrıca kullanıcı kimliğini
 * günlüğe yazan hata ayıklama satırları kaldırıldı.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const preferences = await sql`
      SELECT * FROM user_preferences
      WHERE user_id = ${user.id}
    `

    if (preferences.length === 0) {
      const newPrefs = await sql`
        INSERT INTO user_preferences (user_id)
        VALUES (${user.id})
        RETURNING *
      `
      return NextResponse.json(newPrefs[0])
    }

    return NextResponse.json(preferences[0])
  } catch (error) {
    return handleApiError(error, "Kullanıcı tercihleri")
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const preferences = await request.json()

    const theme = preferences.theme || "system"
    const language = preferences.language || "tr"
    const timezone = preferences.timezone || "Europe/Istanbul"
    const dateFormat = preferences.date_format || "DD/MM/YYYY"
    const timeFormat = preferences.time_format || "24h"
    const currency = preferences.currency || "USD"
    const notificationsEnabled = preferences.notifications_enabled !== false
    const emailNotifications = preferences.email_notifications !== false
    const pushNotifications = preferences.push_notifications || false

    const updated = await sql`
      INSERT INTO user_preferences (
        user_id, theme, language, timezone, date_format, time_format,
        currency, notifications_enabled, email_notifications, push_notifications
      )
      VALUES (
        ${user.id}, ${theme}, ${language}, ${timezone}, ${dateFormat}, ${timeFormat},
        ${currency}, ${notificationsEnabled}, ${emailNotifications}, ${pushNotifications}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        theme = ${theme},
        language = ${language},
        timezone = ${timezone},
        date_format = ${dateFormat},
        time_format = ${timeFormat},
        currency = ${currency},
        notifications_enabled = ${notificationsEnabled},
        email_notifications = ${emailNotifications},
        push_notifications = ${pushNotifications},
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json(updated[0])
  } catch (error) {
    return handleApiError(error, "Kullanıcı tercihleri güncelleme")
  }
}
