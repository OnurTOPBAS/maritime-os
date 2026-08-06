/**
 * Sefer toplamlarının yeniden hesaplanması.
 *
 * Bu mantık daha önce activities/route.ts ve activities/[activityId]/route.ts
 * dosyalarında birebir kopyalanmıştı. Tek yerde toplandı: hesaplama kuralı
 * değişirse iki dosyayı birden güncellemek gerekmesin (ve biri unutulmasın).
 */

import { sql } from "./db"

export async function updateVoyageTotals(voyageId: string): Promise<void> {
  const activities = await sql`
    SELECT
      COALESCE(SUM(days), 0) as total_days,
      COALESCE(SUM(fo_consumption), 0) as total_fo,
      COALESCE(SUM(mgo_consumption), 0) as total_mgo
    FROM voyage_activities
    WHERE voyage_id = ${voyageId}
  `

  const { total_days, total_fo, total_mgo } = activities[0]

  // En güncel yakıt fiyatı kullanılır.
  const bunkerPrices = await sql`
    SELECT fo_price, mgo_price
    FROM voyage_bunker_prices
    WHERE voyage_id = ${voyageId}
    ORDER BY price_date DESC
    LIMIT 1
  `

  const foPrice = Number(bunkerPrices[0]?.fo_price ?? 0)
  const mgoPrice = Number(bunkerPrices[0]?.mgo_price ?? 0)
  const totalFuelCost = Number(total_fo) * foPrice + Number(total_mgo) * mgoPrice

  const voyage = await sql`SELECT daily_running_cost FROM voyages WHERE id = ${voyageId}`
  const dailyRunningCost = Number(voyage[0]?.daily_running_cost ?? 0)
  const totalRunningCost = Number(total_days) * dailyRunningCost

  const costs = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_other_costs
    FROM voyage_cost_items
    WHERE voyage_id = ${voyageId}
  `

  const totalCost = totalFuelCost + totalRunningCost + Number(costs[0].total_other_costs)

  const revenues = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_revenue
    FROM voyage_revenue_items
    WHERE voyage_id = ${voyageId}
  `

  const totalRevenue = Number(revenues[0].total_revenue)
  const netProfit = totalRevenue - totalCost

  await sql`
    UPDATE voyages
    SET total_days = ${total_days},
        total_fo_consumption = ${total_fo},
        total_mgo_consumption = ${total_mgo},
        total_fuel_cost = ${totalFuelCost},
        total_running_cost = ${totalRunningCost},
        total_cost = ${totalCost},
        total_revenue = ${totalRevenue},
        net_profit = ${netProfit},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${voyageId}
  `
}
