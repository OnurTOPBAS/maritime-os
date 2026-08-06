import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userCompanies = await sql`
      SELECT DISTINCT c.id as company_id
      FROM companies c
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id
      WHERE c.owner_id = ${user.id} OR ctm.user_id = ${user.id}
    `

    if (userCompanies.length === 0) {
      return NextResponse.json({ error: "No company access" }, { status: 403 })
    }

    const companyId = userCompanies[0].company_id

    const { certificates, shipId } = await request.json()


    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    }

    for (const cert of certificates) {
      try {
        // Validate required fields
        if (!cert.certificate_name) {
          results.failed++
          results.errors.push({
            row: cert,
            error: "Sertifika adı zorunludur",
          })
          continue
        }

        // Find ship by IMO or use provided shipId
        let targetShipId = shipId

        if (!targetShipId && cert.ship_imo) {
          const ship = await sql`
            SELECT s.id FROM ships s
            JOIN fleets f ON s.fleet_id = f.id
            WHERE f.company_id = ${companyId}
              AND s.imo_number = ${cert.ship_imo}
          `

          if (ship.length === 0) {
            results.failed++
            results.errors.push({
              row: cert,
              error: `IMO ${cert.ship_imo} numaralı gemi bulunamadı`,
            })
            continue
          }

          targetShipId = ship[0].id
        }

        if (!targetShipId) {
          results.failed++
          results.errors.push({
            row: cert,
            error: "Gemi bilgisi bulunamadı",
          })
          continue
        }

        await sql`
          INSERT INTO ship_certificates (
            ship_id,
            certificate_name,
            certificate_type,
            certificate_number,
            issued_date,
            last_annual_date,
            last_intermediate_date,
            expires_date,
            issuing_authority,
            status,
            notes
          ) VALUES (
            ${targetShipId},
            ${cert.certificate_name},
            ${cert.certificate_type || null},
            ${cert.certificate_number || null},
            ${cert.issued_date || null},
            ${cert.last_annual_date || null},
            ${cert.last_intermediate_date || null},
            ${cert.expires_date || null},
            ${cert.issuing_authority || null},
            ${cert.status || "valid"},
            ${cert.notes || null}
          )
        `

        results.success++
      } catch (error) {
        console.error("[v0] Error importing certificate:", error)
        results.failed++
        results.errors.push({
          row: cert,
          error: error instanceof Error ? error.message : "Bilinmeyen hata",
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] Error importing certificates:", error)
    return NextResponse.json(
      {
        error: "Failed to import certificates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
