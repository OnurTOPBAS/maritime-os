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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const shipId = params.id

    // Get ship's company to check permissions
    const shipResult = await sql`
      SELECT s.id, f.company_id
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE s.id = ${shipId}
    `

    if (shipResult.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const companyId = shipResult[0].company_id
    const canView = await checkPermission(user.id, companyId, "canView")

    if (!canView) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const certificates = await sql`
      SELECT *
      FROM ship_certificates
      WHERE ship_id = ${shipId}
      ORDER BY expires_date ASC NULLS LAST, certificate_name ASC
    `

    return NextResponse.json(certificates)
  } catch (error) {
    console.error("[v0] Get certificates error:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const shipId = params.id
    const data = await request.json()

    console.log("[v0] Creating certificate with dates:", {
      issued_date: data.issued_date,
      expires_date: data.expires_date,
      last_annual_date: data.last_annual_date,
      last_intermediate_date: data.last_intermediate_date,
    })

    // Get ship's company to check permissions
    const shipResult = await sql`
      SELECT s.id, f.company_id
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE s.id = ${shipId}
    `

    if (shipResult.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const companyId = shipResult[0].company_id
    const canCreate = await checkPermission(user.id, companyId, "canCreate")

    if (!canCreate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = await sql`
      INSERT INTO ship_certificates (
        ship_id,
        certificate_name,
        certificate_type,
        issued_date,
        last_annual_date,
        last_intermediate_date,
        expires_date,
        issuing_authority,
        certificate_number,
        file_url,
        notes,
        status,
        responsible_person_id,
        notify_90_days,
        notify_60_days,
        notify_30_days,
        notify_15_days,
        notify_7_days
      ) VALUES (
        ${shipId},
        ${data.certificate_name},
        ${data.certificate_type || null},
        ${data.issued_date ? data.issued_date : null}::date,
        ${data.last_annual_date ? data.last_annual_date : null}::date,
        ${data.last_intermediate_date ? data.last_intermediate_date : null}::date,
        ${data.expires_date ? data.expires_date : null}::date,
        ${data.issuing_authority || null},
        ${data.certificate_number || null},
        ${data.file_url || null},
        ${data.notes || null},
        ${data.status || "valid"},
        ${data.responsible_person_id || null},
        ${data.notify_90_days !== false},
        ${data.notify_60_days !== false},
        ${data.notify_30_days !== false},
        ${data.notify_15_days !== false},
        ${data.notify_7_days !== false}
      )
      RETURNING *
    `

    await logCertificateAudit(result[0].id, user.id, "created", null, result[0], request)
    await createCertificateVersion(result[0].id, result[0], user.id)

    console.log("[v0] Certificate created with dates:", {
      issued_date: result[0].issued_date,
      expires_date: result[0].expires_date,
      last_annual_date: result[0].last_annual_date,
      last_intermediate_date: result[0].last_intermediate_date,
    })

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Create certificate error:", error)
    return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 })
  }
}
