import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    // Upsert typing indicator
    await sql`
      INSERT INTO typing_indicators (conversation_id, user_id, started_at)
      VALUES (${conversationId}, ${user.id}, NOW())
      ON CONFLICT (conversation_id, user_id)
      DO UPDATE SET started_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating typing indicator:", error)
    return NextResponse.json({ error: "Failed to update typing indicator" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    // Clean up old indicators first
    await sql`
      DELETE FROM typing_indicators
      WHERE started_at < NOW() - INTERVAL '10 seconds'
    `

    // Get current typing users
    const typing = await sql`
      SELECT u.id, u.name
      FROM typing_indicators ti
      JOIN users u ON ti.user_id = u.id
      WHERE ti.conversation_id = ${conversationId}
        AND ti.user_id != ${user.id}
    `

    return NextResponse.json({ typing })
  } catch (error) {
    console.error("[v0] Error fetching typing indicators:", error)
    return NextResponse.json({ error: "Failed to fetch typing indicators" }, { status: 500 })
  }
}
