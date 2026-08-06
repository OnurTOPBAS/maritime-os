import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCertificateAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { isValidUUID } from "@/lib/utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  try {
    const user = await requireAuth()
    const { certificateId } = await params

    if (!isValidUUID(certificateId)) {
      return NextResponse.json({ error: "Geçersiz sertifika kimliği" }, { status: 400 })
    }

    await requireCertificateAccess(user.id, certificateId, "canView")

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
    return handleApiError(error, "Sertifika sürümleri")
  }
}
