import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"
import { checkPermission } from "@/lib/permissions"

const sql = neon(process.env.DATABASE_URL!)

async function logCertificateAudit(
  certificateId: string,
  userId: string,
  action: "created" | "updated" | "deleted" | "renewed",
  previousValues: any = null,
  newValues: any = null,
  request: NextRequest,
) {
  try {
    const changes: any = {}
    if (previousValues && newValues) {
      // Track what changed
      const fields = [
        "certificate_name",
        "certificate_type",
        "issued_date",
        "expires_date",
        "last_annual_date",
        "last_intermediate_date",
        "certificate_number",
        "issuing_authority",
        "responsible_person_id",
        "status",
      ]
      fields.forEach((field) => {
        if (previousValues[field] !== newValues[field]) {
          changes[field] = {
            from: previousValues[field],
            to: newValues[field],
          }
        }
      })
    }

    await sql`
      INSERT INTO certificate_audit_log (
        certificate_id,
        user_id,
        action,
        changes,
        previous_values,
        new_values,
        ip_address,
        user_agent
      ) VALUES (
        ${certificateId},
        ${userId},
        ${action},
        ${JSON.stringify(changes)},
        ${previousValues ? JSON.stringify(previousValues) : null},
        ${newValues ? JSON.stringify(newValues) : null},
        ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null},
        ${request.headers.get("user-agent") || null}
      )
    `
  } catch (error) {
    console.error("[v0] Failed to log certificate audit:", error)
  }
}

async function createCertificateVersion(certificateId: string, certificateData: any, userId: string) {
  try {
    // Get current version count
    const versionCount = await sql`
      SELECT COUNT(*) as count
      FROM certificate_versions
      WHERE certificate_id = ${certificateId}
    `

    const versionNumber = Number.parseInt(versionCount[0].count) + 1

    await sql`
      INSERT INTO certificate_versions (
        certificate_id,
        version_number,
        certificate_name,
        certificate_type,
        issued_date,
        expires_date,
        issuing_authority,
        certificate_number,
        file_url,
        notes,
        changed_by
      ) VALUES (
        ${certificateId},
        ${versionNumber},
        ${certificateData.certificate_name},
        ${certificateData.certificate_type || null},
        ${certificateData.issued_date || null},
        ${certificateData.expires_date || null},
        ${certificateData.issuing_authority || null},
        ${certificateData.certificate_number || null},
        ${certificateData.file_url || null},
        ${certificateData.notes || null},
        ${userId}
      )
    `
  } catch (error) {
    console.error("[v0] Failed to create certificate version:", error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; certificateId: string } }) {
  try {
    const user = await requireAuth()
    const { certificateId } = params
    const data = await request.json()

    console.log("[v0] Updating certificate with dates:", {
      issued_date: data.issued_date,
      expires_date: data.expires_date,
      last_annual_date: data.last_annual_date,
      last_intermediate_date: data.last_intermediate_date,
    })

    // Get certificate's company to check permissions
    const certResult = await sql`
      SELECT sc.*, f.company_id
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE sc.id = ${certificateId}
    `

    if (certResult.length === 0) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    const companyId = certResult[0].company_id

    console.log("[v0] Checking permissions:", {
      userId: user.id,
      companyId,
      certificateId,
    })

    const canEdit = await checkPermission(user.id, companyId, "canEdit")

    console.log("[v0] Permission check result:", { canEdit })

    if (!canEdit) {
      console.error("[v0] Permission denied for user:", {
        userId: user.id,
        companyId,
        action: "canEdit",
      })
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "You do not have permission to edit certificates for this company",
        },
        { status: 403 },
      )
    }

    const previousValues = certResult[0]

    const result = await sql`
      UPDATE ship_certificates
      SET
        certificate_name = ${data.certificate_name},
        certificate_type = ${data.certificate_type || null},
        issued_date = ${data.issued_date ? data.issued_date : null}::date,
        last_annual_date = ${data.last_annual_date ? data.last_annual_date : null}::date,
        last_intermediate_date = ${data.last_intermediate_date ? data.last_intermediate_date : null}::date,
        expires_date = ${data.expires_date ? data.expires_date : null}::date,
        issuing_authority = ${data.issuing_authority || null},
        certificate_number = ${data.certificate_number || null},
        file_url = ${data.file_url || null},
        notes = ${data.notes || null},
        status = ${data.status || "valid"},
        responsible_person_id = ${data.responsible_person_id || null},
        notify_90_days = ${data.notify_90_days !== false},
        notify_60_days = ${data.notify_60_days !== false},
        notify_30_days = ${data.notify_30_days !== false},
        notify_15_days = ${data.notify_15_days !== false},
        notify_7_days = ${data.notify_7_days !== false},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${certificateId}
      RETURNING *
    `

    await logCertificateAudit(certificateId, user.id, "updated", previousValues, result[0], request)
    await createCertificateVersion(certificateId, result[0], user.id)

    console.log("[v0] Certificate updated with dates:", {
      issued_date: result[0].issued_date,
      expires_date: result[0].expires_date,
      last_annual_date: result[0].last_annual_date,
      last_intermediate_date: result[0].last_intermediate_date,
    })

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update certificate error:", error)
    return NextResponse.json({ error: "Failed to update certificate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; certificateId: string } }) {
  try {
    const user = await requireAuth()
    const { certificateId } = params

    // Get certificate's company to check permissions
    const certResult = await sql`
      SELECT sc.*, f.company_id
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE sc.id = ${certificateId}
    `

    if (certResult.length === 0) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    const companyId = certResult[0].company_id

    console.log("[v0] Checking permissions:", {
      userId: user.id,
      companyId,
      certificateId,
    })

    const canDelete = await checkPermission(user.id, companyId, "canDelete")

    console.log("[v0] Permission check result:", { canDelete })

    if (!canDelete) {
      console.error("[v0] Permission denied for user:", {
        userId: user.id,
        companyId,
        action: "canDelete",
      })
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "You do not have permission to delete certificates for this company",
        },
        { status: 403 },
      )
    }

    await logCertificateAudit(certificateId, user.id, "deleted", certResult[0], null, request)

    await sql`
      DELETE FROM ship_certificates
      WHERE id = ${certificateId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete certificate error:", error)
    return NextResponse.json({ error: "Failed to delete certificate" }, { status: 500 })
  }
}
