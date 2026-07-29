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
        totalFixtures: 0,
        activeFixtures: 0,
        completedFixtures: 0,
        totalRevenue: 0,
        monthlyTrend: [],
        topCharterers: [],
      })
    }

    // Total fixtures by status
    const statusResult = await sql`
      SELECT fx.status, COUNT(*) as count 
      FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
      GROUP BY fx.status
    `

    let totalFixtures = 0
    let activeFixtures = 0
    let completedFixtures = 0
    statusResult.forEach((row: any) => {
      const count = Number.parseInt(row.count)
      totalFixtures += count
      if (row.status === "active") activeFixtures = count
      else if (row.status === "completed") completedFixtures = count
    })

    // Total revenue from rate
    const revenueResult = await sql`
      SELECT SUM(fx.rate) as total_revenue
      FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
    `
    const totalRevenue = Number.parseFloat(revenueResult[0]?.total_revenue || "0")

    // Monthly trend (last 6 months)
    const monthlyResult = await sql`
      SELECT 
        TO_CHAR(fx.laycan_from, 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM(fx.rate) as revenue
      FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds})
        AND fx.laycan_from >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(fx.laycan_from, 'YYYY-MM')
      ORDER BY month
    `
    const monthlyTrend = monthlyResult.map((row: any) => ({
      month: row.month,
      count: Number.parseInt(row.count),
      revenue: Number.parseFloat(row.revenue || "0"),
    }))

    // Top charterers
    const charterersResult = await sql`
      SELECT fx.charterer, COUNT(*) as count, SUM(fx.rate) as revenue
      FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${companyIds}) AND fx.charterer IS NOT NULL
      GROUP BY fx.charterer
      ORDER BY count DESC
      LIMIT 5
    `
    const topCharterers = charterersResult.map((row: any) => ({
      name: row.charterer,
      count: Number.parseInt(row.count),
      revenue: Number.parseFloat(row.revenue || "0"),
    }))

    return NextResponse.json({
      totalFixtures,
      activeFixtures,
      completedFixtures,
      totalRevenue: Math.round(totalRevenue),
      monthlyTrend,
      topCharterers,
    })
  } catch (error) {
    console.error("Error fetching fixture stats:", error)
    return NextResponse.json({ error: `Failed to fetch fixture statistics: ${error}` }, { status: 500 })
  }
}
