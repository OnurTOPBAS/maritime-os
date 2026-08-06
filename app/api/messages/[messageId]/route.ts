import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params

    const [message] = await sql`
      SELECT 
        m.*,
        sender.name as sender_name,
        sender.email as sender_email,
        recipient.name as recipient_name,
        recipient.email as recipient_email
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users recipient ON m.recipient_id = recipient.id
      WHERE m.id = ${messageId}
        AND (m.sender_id = ${user.id} OR m.recipient_id = ${user.id})
    `

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Mark as read if user is recipient
    if (message.recipient_id === user.id && !message.is_read) {
      await sql`
        UPDATE messages
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = ${messageId}
      `
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("[v0] Error fetching message:", error)
    return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params

    await sql`
      DELETE FROM messages
      WHERE id = ${messageId}
        AND sender_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting message:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
