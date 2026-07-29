import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: { id: string; certificateId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certificateId } = params

    // Get all versions of the certificate file
    const versions = await sql`
      SELECT 
        scf.*,
        u.name as uploaded_by_name
      FROM ship_certificate_files scf
      LEFT JOIN users u ON scf.uploaded_by = u.id
      WHERE scf.certificate_id = ${certificateId}
      ORDER BY scf.version DESC, scf.created_at DESC
    `

    return NextResponse.json(versions)
  } catch (error) {
    console.error("[v0] Error fetching certificate versions:", error)
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string; certificateId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certificateId } = params
    const body = await request.json()
    const { file_url, file_name, file_size, file_type, thumbnail_url, notes } = body

    // Get the current max version
    const maxVersionResult = await sql`
      SELECT COALESCE(MAX(version), 0) as max_version
      FROM ship_certificate_files
      WHERE certificate_id = ${certificateId}
    `
    const nextVersion = (maxVersionResult[0]?.max_version || 0) + 1

    // Mark all previous versions as not current
    await sql`
      UPDATE ship_certificate_files
      SET is_current = false
      WHERE certificate_id = ${certificateId}
    `

    // Insert new version
    const newVersion = await sql`
      INSERT INTO ship_certificate_files (
        certificate_id,
        file_url,
        file_name,
        file_size,
        file_type,
        thumbnail_url,
        version,
        is_current,
        uploaded_by,
        notes
      ) VALUES (
        ${certificateId},
        ${file_url},
        ${file_name || null},
        ${file_size || null},
        ${file_type || null},
        ${thumbnail_url || null},
        ${nextVersion},
        true,
        ${user.id},
        ${notes || null}
      )
      RETURNING *
    `

    // Update the main certificate file_url
    await sql`
      UPDATE ship_certificates
      SET file_url = ${file_url}
      WHERE id = ${certificateId}
    `

    return NextResponse.json(newVersion[0])
  } catch (error) {
    console.error("[v0] Error creating certificate version:", error)
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 })
  }
}
