import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await sql`
      SELECT 
        c.*,
        creator.name as creator_name,
        (
          SELECT COUNT(*)::int
          FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
        ) as participant_count,
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.created_at > COALESCE(cp_user.last_read_at, '1970-01-01')
        ) as unread_count
      FROM conversations c
      JOIN users creator ON c.created_by = creator.id
      JOIN conversation_participants cp_user ON c.id = cp_user.conversation_id
      WHERE cp_user.user_id = ${user.id}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("[v0] Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, participantIds } = body

    if (!type || !participantIds || participantIds.length === 0) {
      return NextResponse.json({ error: "Type and participants are required" }, { status: 400 })
    }

    // Create conversation
    const [conversation] = await sql`
      INSERT INTO conversations (name, type, created_by)
      VALUES (${name || null}, ${type}, ${user.id})
      RETURNING *
    `

    // Add creator as participant
    await sql`
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (${conversation.id}, ${user.id})
    `

    // Add other participants
    for (const participantId of participantIds) {
      if (participantId !== user.id) {
        await sql`
          INSERT INTO conversation_participants (conversation_id, user_id)
          VALUES (${conversation.id}, ${participantId})
        `
      }
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] Error creating conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
