import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, reviewNotes } = body

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const result = await sql`
      UPDATE permission_requests
      SET 
        status = ${status},
        reviewed_by = ${user.id},
        reviewed_at = CURRENT_TIMESTAMP,
        review_notes = ${reviewNotes || null}
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const request_data = result[0]

    // If approved, create temporary permission
    if (status === "approved") {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + request_data.duration_days)

      await sql`
        INSERT INTO temporary_permissions (user_id, permission_id, granted_by, reason, expires_at)
        VALUES (
          ${request_data.user_id},
          ${request_data.permission_id},
          ${user.id},
          ${request_data.reason},
          ${expiresAt.toISOString()}
        )
      `

      // Log the permission change
      await sql`
        INSERT INTO permission_change_history (user_id, changed_by, change_type, permission_id, reason)
        VALUES (${request_data.user_id}, ${user.id}, 'grant_temporary', ${request_data.permission_id}, ${request_data.reason})
      `
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating permission request:", error)
    return NextResponse.json({ error: "Failed to update permission request" }, { status: 500 })
  }
}
