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

    const versions = await sql`
      SELECT 
        cv.*,
        u.name as changed_by_name,
        u.email as changed_by_email
      FROM certificate_versions cv
      LEFT JOIN users u ON cv.changed_by = u.id
      WHERE cv.certificate_id = ${certificateId}
      ORDER BY cv.version_number DESC
    `

    return NextResponse.json(versions)
  } catch (error) {
    console.error("[v0] Get versions error:", error)
    return NextResponse.json({ error: "Failed to get versions" }, { status: 500 })
  }
}
