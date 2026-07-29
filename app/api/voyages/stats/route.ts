import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userResponse = await fetch(`${request.url.split("/api")[0]}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await userResponse.json()
    const userId = userData.user?.id

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const userCompanies = await sql`
      SELECT id as company_id FROM companies WHERE owner_id = ${userId}
      UNION
      SELECT company_id FROM company_team_members WHERE user_id = ${userId}
    `

    const companyIds = userCompanies.map((row: any) => row.company_id).filter(Boolean)

    if (companyIds.length === 0) {
      return NextResponse.json({
        totalVoyages: 0,
        ongoingVoyages: 0,
        completedVoyages: 0,
        averageDuration: 0,
        totalDistance: 0,
        totalFuelConsumption: 0,
        performanceMetrics: [],
      })
    }

    // Total voyages by status
    const statusResult = await sql`
      SELECT v.status, COUNT(*) as count 
      FROM voyages v
      JOIN fixtures fx ON v.fixture_id = fx.id
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
      GROUP BY v.status
    `

    let totalVoyages = 0
    let ongoingVoyages = 0
    let completedVoyages = 0
    statusResult.forEach((row: any) => {
      const count = Number.parseInt(row.count)
      totalVoyages += count
      if (row.status === "ongoing" || row.status === "in_progress") ongoingVoyages = count
      else if (row.status === "completed") completedVoyages = count
    })

    // Average duration using total_days field
    const durationResult = await sql`
      SELECT AVG(v.total_days) as avg_duration
      FROM voyages v
      JOIN fixtures fx ON v.fixture_id = fx.id
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds}) 
        AND v.total_days IS NOT NULL
    `
    const averageDuration = Number.parseFloat(durationResult[0]?.avg_duration || "0")

    const distanceResult = await sql`
      SELECT SUM(vl.distance_nm) as total_distance
      FROM voyage_legs vl
      JOIN voyages v ON vl.voyage_id = v.id
      JOIN fixtures fx ON v.fixture_id = fx.id
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
    `
    const totalDistance = Number.parseFloat(distanceResult[0]?.total_distance || "0")

    // Total fuel consumption
    const metricsResult = await sql`
      SELECT 
        SUM(v.total_fo_consumption) as total_fo,
        SUM(v.total_mgo_consumption) as total_mgo
      FROM voyages v
      JOIN fixtures fx ON v.fixture_id = fx.id
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
    `
    const totalFo = Number.parseFloat(metricsResult[0]?.total_fo || "0")
    const totalMgo = Number.parseFloat(metricsResult[0]?.total_mgo || "0")
    const totalFuelConsumption = totalFo + totalMgo

    // Performance metrics by ship
    const performanceResult = await sql`
      SELECT 
        s.name as ship_name,
        COUNT(v.id) as voyage_count,
        AVG(v.total_days) as avg_days,
        AVG(v.total_fo_consumption + v.total_mgo_consumption) as avg_fuel
      FROM voyages v
      JOIN fixtures fx ON v.fixture_id = fx.id
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
      GROUP BY s.id, s.name
      ORDER BY voyage_count DESC
      LIMIT 10
    `
    const performanceMetrics = performanceResult.map((row: any) => ({
      shipName: row.ship_name,
      voyageCount: Number.parseInt(row.voyage_count),
      avgDistance: 0, // Not available in current schema
      avgFuel: Number.parseFloat(row.avg_fuel || "0"),
    }))

    return NextResponse.json({
      totalVoyages,
      ongoingVoyages,
      completedVoyages,
      averageDuration: Math.round(averageDuration * 10) / 10,
      totalDistance: Math.round(totalDistance),
      totalFuelConsumption: Math.round(totalFuelConsumption),
      performanceMetrics,
    })
  } catch (error) {
    console.error("Error fetching voyage stats:", error)
    return NextResponse.json({ error: `Failed to fetch voyage statistics: ${error}` }, { status: 500 })
  }
}
