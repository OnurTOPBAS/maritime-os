import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params
    const body = await request.json()
    const { comment, attachments = [] } = body

    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO task_comments (task_id, user_id, comment, attachments)
      VALUES (${taskId}, ${user.id}, ${comment}, ${JSON.stringify(attachments)})
      RETURNING *
    `

    return NextResponse.json({ comment: result[0] })
  } catch (error) {
    console.error("[v0] Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
