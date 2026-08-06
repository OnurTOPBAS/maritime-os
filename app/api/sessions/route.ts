import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"


async function ensureUserSessionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)`
  } catch (error) {
    // Table might already exist, ignore error
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    await ensureUserSessionsTable()

    // Get all active sessions for the user
    const sessions = await sql`
      SELECT 
        id,
        session_token,
        ip_address,
        user_agent,
        last_active,
        created_at,
        expires_at
      FROM user_sessions
      WHERE user_id = ${user.id}
        AND expires_at > NOW()
      ORDER BY last_active DESC
    `

    return NextResponse.json(sessions)
  } catch (error: any) {
    console.error("[v0] Error fetching sessions:", error)
    return NextResponse.json({ sessions: [], tableNotExists: true })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    await ensureUserSessionsTable()

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const logoutAll = searchParams.get("logoutAll") === "true"

    if (logoutAll) {
      // Logout from all devices except current session
      const currentToken = request.cookies.get("session_token")?.value

      await sql`
        DELETE FROM user_sessions
        WHERE user_id = ${user.id}
          AND session_token != ${currentToken || ""}
      `

      return NextResponse.json({
        message: "Tüm diğer oturumlar sonlandırıldı",
      })
    } else if (sessionId) {
      // Logout from specific session
      await sql`
        DELETE FROM user_sessions
        WHERE id = ${sessionId}
          AND user_id = ${user.id}
      `

      return NextResponse.json({
        message: "Oturum sonlandırıldı",
      })
    }

    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error deleting session:", error)
    return NextResponse.json({ error: "Oturum sonlandırılırken hata oluştu" }, { status: 500 })
  }
}
