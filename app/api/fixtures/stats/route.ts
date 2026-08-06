import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: Request) {
  try {
    // Bu rota daha önce Authorization: Bearer başlığı bekliyordu; oysa uygulama
    // çerez tabanlı oturum kullanır. Tarayıcıdan gelen her istek 401 alıyor,
    // yani istatistik ekranı hiç çalışmıyordu.
    const user = await requireAuth()
    const companyIds = await getAccessibleCompanyIds(user.id)

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
      WHERE f.company_id = ANY(${companyIds}::uuid[])
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
      WHERE f.company_id = ANY(${companyIds}::uuid[])
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
      WHERE f.company_id = ANY(${companyIds}::uuid[])
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
      WHERE f.company_id = ANY(${companyIds}::uuid[]) AND fx.charterer IS NOT NULL
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
    return handleApiError(error, "İstatistikler")
  }
}
