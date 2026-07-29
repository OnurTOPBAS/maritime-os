import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    const userCompanies = await sql`
      SELECT id as company_id FROM companies WHERE owner_id = ${userId}
      UNION
      SELECT company_id FROM company_team_members WHERE user_id = ${userId}
    `

    const companyIds = userCompanies.map((row: any) => row.company_id).filter(Boolean)

    if (companyIds.length === 0) {
      return NextResponse.json({
        totalShips: 0,
        activeShips: 0,
        inactiveShips: 0,
        averageAge: 0,
        totalDwt: 0,
        totalTeu: 0,
        shipsByType: [],
        shipsByFlag: [],
        certificateCompliance: {
          averageScore: 0,
          shipsWithIssues: 0,
          expiringCertificates: 0,
        },
        vettingStats: {
          totalInspections: 0,
          averageScore: 0,
          totalObservations: 0,
        },
      })
    }

    // Total ships
    const totalResult = await sql`
      SELECT COUNT(*) as count 
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
    `
    const totalShips = Number.parseInt(totalResult[0]?.count || "0")

    // Active/Inactive ships
    const statusResult = await sql`
      SELECT s.status, COUNT(*) as count 
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
      GROUP BY s.status
    `

    let activeShips = 0
    let inactiveShips = 0
    statusResult.forEach((row: any) => {
      if (row.status === "active") activeShips = Number.parseInt(row.count)
      else if (row.status === "inactive") inactiveShips = Number.parseInt(row.count)
    })

    // Average age
    const ageResult = await sql`
      SELECT AVG(EXTRACT(YEAR FROM CURRENT_DATE) - s.built_year) as avg_age
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds}) AND s.built_year IS NOT NULL
    `
    const averageAge = Number.parseFloat(ageResult[0]?.avg_age || "0")

    // Total DWT
    const capacityResult = await sql`
      SELECT SUM(s.dwt) as total_dwt
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
    `
    const totalDwt = Number.parseFloat(capacityResult[0]?.total_dwt || "0")

    const totalTeu = 0

    // Ships by type
    const typeResult = await sql`
      SELECT s.vessel_type, COUNT(*) as count 
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds}) AND s.vessel_type IS NOT NULL
      GROUP BY s.vessel_type
      ORDER BY count DESC
    `
    const shipsByType = typeResult.map((row: any) => ({
      type: row.vessel_type,
      count: Number.parseInt(row.count),
    }))

    // Ships by flag
    const flagResult = await sql`
      SELECT s.flag, COUNT(*) as count 
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds}) AND s.flag IS NOT NULL
      GROUP BY s.flag
      ORDER BY count DESC
      LIMIT 10
    `
    const shipsByFlag = flagResult.map((row: any) => ({
      flag: row.flag,
      count: Number.parseInt(row.count),
    }))

    // Get ships with their required certificates vs actual certificates
    const complianceResult = await sql`
      SELECT 
        s.id as ship_id,
        s.vessel_type,
        COUNT(DISTINCT cr.id) as required_certs,
        COUNT(DISTINCT CASE 
          WHEN sc.id IS NOT NULL AND (sc.expires_date IS NULL OR sc.expires_date >= CURRENT_DATE) 
          THEN sc.certificate_type 
        END) as valid_certs
      FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      LEFT JOIN certificate_requirements cr ON cr.vessel_type = s.vessel_type AND cr.is_mandatory = true
      LEFT JOIN ship_certificates sc ON sc.ship_id = s.id AND sc.certificate_type = cr.certificate_type
      WHERE f.company_id = ANY(${companyIds})
      GROUP BY s.id, s.vessel_type
    `

    let totalScore = 0
    let shipsWithIssues = 0

    complianceResult.forEach((row: any) => {
      const requiredCerts = Number.parseInt(row.required_certs || "0")
      const validCerts = Number.parseInt(row.valid_certs || "0")
      const score = requiredCerts > 0 ? (validCerts / requiredCerts) * 100 : 100
      totalScore += score
      if (score < 100) shipsWithIssues++
    })

    const averageScore = complianceResult.length > 0 ? totalScore / complianceResult.length : 0

    const expiringCertsResult = await sql`
      SELECT COUNT(*) as count
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
      AND sc.expires_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `

    let vettingStats = {
      totalInspections: 0,
      averageScore: 0,
      totalObservations: 0,
    }

    try {
      const vettingResult = await sql`
        SELECT 
          COUNT(*) as total_inspections,
          AVG(score) as avg_score,
          SUM(observations_count) as total_observations
        FROM vetting_inspections vi
        JOIN ships s ON vi.ship_id = s.id
        JOIN fleets f ON s.fleet_id = f.id
        WHERE f.company_id = ANY(${companyIds})
      `

      vettingStats = {
        totalInspections: Number.parseInt(vettingResult[0]?.total_inspections || "0"),
        averageScore: Math.round((Number.parseFloat(vettingResult[0]?.avg_score) || 0) * 10) / 10,
        totalObservations: Number.parseInt(vettingResult[0]?.total_observations || "0"),
      }
    } catch (vettingError) {
      console.log("[v0] Vetting stats not available yet:", vettingError)
      // Return default values if vetting table doesn't exist yet
    }

    return NextResponse.json({
      totalShips,
      activeShips,
      inactiveShips,
      averageAge: Math.round(averageAge * 10) / 10,
      totalDwt: Math.round(totalDwt),
      totalTeu: Math.round(totalTeu),
      shipsByType,
      shipsByFlag,
      certificateCompliance: {
        averageScore: Math.round(averageScore * 10) / 10,
        shipsWithIssues,
        expiringCertificates: Number.parseInt(expiringCertsResult[0]?.count || "0"),
      },
      vettingStats,
    })
  } catch (error) {
    console.error("Error fetching ship stats:", error)
    return NextResponse.json({ error: `Failed to fetch ship statistics: ${error}` }, { status: 500 })
  }
}
