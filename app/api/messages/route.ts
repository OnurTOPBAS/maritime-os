import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let messages
    if (conversationId) {
      // Get messages for a specific conversation
      messages = await sql`
        SELECT 
          m.*,
          u.name as sender_name,
          u.email as sender_email
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId}
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // Get all direct messages for the user
      messages = await sql`
        SELECT 
          m.*,
          u.name as sender_name,
          u.email as sender_email
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ${user.id} OR m.recipient_id = ${user.id})
          AND m.conversation_id IS NULL
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, conversationId, subject, body: messageBody, content, attachments, threadId } = body

    const actualMessageBody = messageBody || content

    if (!actualMessageBody) {
      console.error("[v0] Message body missing:", { body })
      return NextResponse.json({ error: "Message body is required" }, { status: 400 })
    }

    console.log("[v0] Creating message:", {
      conversationId,
      recipientId,
      hasBody: !!actualMessageBody,
      bodyLength: actualMessageBody?.length,
    })

    // Insert message
    const [message] = await sql`
      INSERT INTO messages (
        sender_id, recipient_id, conversation_id, subject, body, attachments, parent_message_id
      ) VALUES (
        ${user.id}, ${recipientId || null}, ${conversationId || null}, 
        ${subject || null}, ${actualMessageBody}, ${JSON.stringify(attachments || [])}, ${threadId || null}
      )
      RETURNING *
    `

    if (conversationId) {
      const participants = await sql`
        SELECT DISTINCT cp.user_id, u.name, u.email
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ${conversationId}
          AND cp.user_id != ${user.id}
      `

      // Get conversation name
      const [conversation] = await sql`
        SELECT name, type FROM conversations WHERE id = ${conversationId}
      `

      const conversationName = conversation?.name || "Grup Sohbeti"

      for (const participant of participants) {
        await sql`
          INSERT INTO notifications (user_id, type, title, message, link, metadata)
          VALUES (
            ${participant.user_id}, 
            'message', 
            'Yeni Mesaj',
            ${`${user.name}: ${actualMessageBody.substring(0, 100)}${actualMessageBody.length > 100 ? "..." : ""}`},
            ${`/dashboard/messages?conversation=${conversationId}`},
            ${JSON.stringify({
              conversationId,
              conversationName,
              senderId: user.id,
              senderName: user.name,
            })}
          )
        `
      }
    }

    // Check for mentions in the message body
    const mentionRegex = /@(\w+)/g
    const mentions = actualMessageBody.match(mentionRegex)

    if (mentions) {
      for (const mention of mentions) {
        const username = mention.substring(1)
        const [mentionedUser] = await sql`
          SELECT id, name FROM users WHERE name ILIKE ${username} OR email ILIKE ${username}
        `

        if (mentionedUser) {
          await sql`
            INSERT INTO mentions (message_id, mentioned_user_id)
            VALUES (${message.id}, ${mentionedUser.id})
          `

          // Create notification for mentioned user
          await sql`
            INSERT INTO notifications (user_id, type, title, message, link, metadata)
            VALUES (
              ${mentionedUser.id}, 
              'mention', 
              'Bahsedildiniz',
              ${`${user.name} sizi bir mesajda bahsetti`},
              ${`/dashboard/messages?conversation=${conversationId || ""}&message=${message.id}`},
              ${JSON.stringify({
                messageId: message.id,
                senderId: user.id,
                senderName: user.name,
              })}
            )
          `
        }
      }
    }

    // Create notification for direct message recipient
    if (recipientId && !conversationId) {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          ${recipientId}, 
          'message', 
          'Yeni Mesaj',
          ${`${user.name}: ${actualMessageBody.substring(0, 100)}${actualMessageBody.length > 100 ? "..." : ""}`},
          ${`/dashboard/messages?recipient=${recipientId}`},
          ${JSON.stringify({
            senderId: user.id,
            senderName: user.name,
          })}
        )
      `
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("[v0] Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
