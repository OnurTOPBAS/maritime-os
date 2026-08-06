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
    return handleApiError(error, "Sertifika denetim kaydı")
  }
}
