import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { isValidUUID } from "@/lib/utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const shipId = params.id

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    // Get ship details
    const shipResult = await sql`
      SELECT s.*, f.company_id
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE s.id = ${shipId}
    `

    if (shipResult.length === 0) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 })
    }

    const ship = shipResult[0]

    // Get required certificates for this vessel type
    const requiredCerts = await sql`
      SELECT *
      FROM certificate_requirements
      WHERE vessel_type = ${ship.vessel_type}
      ORDER BY is_mandatory DESC, certificate_name ASC
    `

    // Get existing certificates for this ship
    const existingCerts = await sql`
      SELECT *
      FROM ship_certificates
      WHERE ship_id = ${shipId}
    `

    // Calculate compliance
    const compliance = requiredCerts.map((req: any) => {
      const existing = existingCerts.find((cert: any) => cert.certificate_type === req.certificate_type)

      let status = "missing"
      let daysUntilExpiry = null
      let expiryStatus = null

      if (existing) {
        if (existing.status === "not_applicable") {
          status = "not_applicable"
        } else if (existing.expires_date) {
          const expiry = new Date(existing.expires_date)
          const now = new Date()
          daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiry < 0) {
            status = "expired"
            expiryStatus = "expired"
          } else if (daysUntilExpiry < req.critical_days_before_expiry) {
            status = "critical"
            expiryStatus = "critical"
          } else if (daysUntilExpiry < req.warning_days_before_expiry) {
            status = "warning"
            expiryStatus = "warning"
          } else {
            status = "valid"
            expiryStatus = "valid"
          }
        } else {
          status = "valid"
        }
      }

      return {
        requirement: req,
        certificate: existing || null,
        status,
        daysUntilExpiry,
        expiryStatus,
      }
    })

    // Calculate compliance score
    const mandatoryCerts = compliance.filter((c) => c.requirement.is_mandatory)
    const validMandatory = mandatoryCerts.filter((c) => c.status === "valid" || c.status === "not_applicable")
    const complianceScore =
      mandatoryCerts.length > 0 ? Math.round((validMandatory.length / mandatoryCerts.length) * 100) : 100

    // Get missing certificates
    const missingCerts = compliance.filter((c) => c.status === "missing" && c.requirement.is_mandatory)

    // Get expiring/expired certificates
    const expiredCerts = compliance.filter((c) => c.status === "expired")
    const criticalCerts = compliance.filter((c) => c.status === "critical")
    const warningCerts = compliance.filter((c) => c.status === "warning")

    return NextResponse.json({
      ship,
      compliance,
      complianceScore,
      summary: {
        total: requiredCerts.length,
        mandatory: mandatoryCerts.length,
        valid: validMandatory.length,
        missing: missingCerts.length,
        expired: expiredCerts.length,
        critical: criticalCerts.length,
        warning: warningCerts.length,
      },
      missingCertificates: missingCerts,
      expiredCertificates: expiredCerts,
      criticalCertificates: criticalCerts,
      warningCertificates: warningCerts,
    })
  } catch (error) {
    console.error("[v0] Compliance check error:", error)
    return NextResponse.json({ error: "Failed to check compliance" }, { status: 500 })
  }
}
