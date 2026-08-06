import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const { messageId } = await params

    const reactions = await sql`
      SELECT 
        mr.reaction,
        COUNT(*)::int as count,
        ARRAY_AGG(json_build_object('id', u.id, 'name', u.name)) as users
      FROM message_reactions mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.message_id = ${messageId}
      GROUP BY mr.reaction
    `

    return NextResponse.json({ reactions })
  } catch (error) {
    console.error("[v0] Error fetching reactions:", error)
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params
    const { reaction } = await request.json()

    // Toggle reaction (add if doesn't exist, remove if exists)
    const existing = await sql`
      SELECT id FROM message_reactions
      WHERE message_id = ${messageId} AND user_id = ${user.id} AND reaction = ${reaction}
    `

    if (existing.length > 0) {
      await sql`
        DELETE FROM message_reactions
        WHERE message_id = ${messageId} AND user_id = ${user.id} AND reaction = ${reaction}
      `
    } else {
      await sql`
        INSERT INTO message_reactions (message_id, user_id, reaction)
        VALUES (${messageId}, ${user.id}, ${reaction})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error toggling reaction:", error)
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
  }
}
