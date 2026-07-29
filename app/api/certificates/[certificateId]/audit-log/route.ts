import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"
import { isValidUUID } from "@/lib/utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { certificateId: string } }) {
  try {
    await requireAuth()
    const { certificateId } = params

    if (!isValidUUID(certificateId)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 })
    }

    const auditLogs = await sql`
      SELECT 
        cal.*,
        u.name as user_name,
        u.email as user_email
      FROM certificate_audit_log cal
      LEFT JOIN users u ON cal.user_id = u.id
      WHERE cal.certificate_id = ${certificateId}
      ORDER BY cal.created_at DESC
    `

    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error("[v0] Get audit log error:", error)
    return NextResponse.json({ error: "Failed to get audit log" }, { status: 500 })
  }
}
