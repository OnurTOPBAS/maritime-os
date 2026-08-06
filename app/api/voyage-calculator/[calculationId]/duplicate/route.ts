import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

/**
 * Bir sefer hesabının kopyasını oluşturur.
 *
 * Düzeltmeler:
 *  - next-auth'un getServerSession() kullanılıyordu; uygulama kendi çerez
 *    tabanlı oturumunu kullandığı için rota her istekte 401 dönüyordu.
 *  - Hata yanıtında iç hata mesajı istemciye gönderiliyordu (bilgi sızıntısı).
 *  - Kullanıcı kimliği ve kayıt adları günlüğe yazılıyordu.
 *
 * Sahiplik: voyage_calculations kayıtları kullanıcıya aittir; kopyalanacak
 * kayıt sorgusu user_id ile sınırlandığından başkasının hesabı kopyalanamaz.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ calculationId: string }> },
) {
  try {
    const user = await requireAuth()
    const { calculationId } = await params

    const calcResult = await sql`
      SELECT * FROM voyage_calculations
      WHERE id = ${calculationId} AND user_id = ${user.id}
    `

    if (calcResult.length === 0) {
      return NextResponse.json({ error: "Hesap bulunamadı" }, { status: 404 })
    }

    const original = calcResult[0]
    const newName = `${original.name} (Kopya)`

    const newCalc = await sql`
      INSERT INTO voyage_calculations (
        user_id, name, ship_id, ship_name, charterer, service_speed, running_cost_per_day,
        fo_price, mgo_price, total_days, total_fo_consumption,
        total_mgo_consumption, fuel_cost, running_cost, other_costs, total_cost, total_revenue, net_profit,
        status
      ) VALUES (
        ${user.id}, ${newName}, ${original.ship_id}, ${original.ship_name}, ${original.charterer},
        ${original.service_speed || 0}, ${original.running_cost_per_day || 0},
        ${original.fo_price || 0}, ${original.mgo_price || 0},
        ${original.total_days || 0},
        ${original.total_fo_consumption || 0}, ${original.total_mgo_consumption || 0},
        ${original.fuel_cost || 0},
        ${original.running_cost || 0}, ${original.other_costs || 0}, ${original.total_cost || 0},
        ${original.total_revenue || 0},
        ${original.net_profit || 0}, 'draft'
      )
      RETURNING id
    `

    const newCalcId = newCalc[0].id

    await sql`
      UPDATE voyage_calculations
      SET fuel_consumption = ${JSON.stringify(original.fuel_consumption || {})}::jsonb,
          operations = ${JSON.stringify(original.operations || {})}::jsonb
      WHERE id = ${newCalcId}
    `

    if (Array.isArray(original.tags) && original.tags.length > 0) {
      await sql`UPDATE voyage_calculations SET tags = ${original.tags} WHERE id = ${newCalcId}`
    }

    const legs = await sql`SELECT * FROM voyage_calc_legs WHERE calculation_id = ${calculationId}`
    for (const leg of legs) {
      await sql`
        INSERT INTO voyage_calc_legs (calculation_id, leg_order, from_port, to_port, distance_nm, condition, sea_days, fo_consumption, mgo_consumption)
        VALUES (${newCalcId}, ${leg.leg_order || 0}, ${leg.from_port}, ${leg.to_port}, ${leg.distance_nm || 0}, ${leg.condition}, ${leg.sea_days || 0}, ${leg.fo_consumption || 0}, ${leg.mgo_consumption || 0})
      `
    }

    const costs = await sql`SELECT * FROM voyage_calc_costs WHERE calculation_id = ${calculationId}`
    for (const cost of costs) {
      await sql`
        INSERT INTO voyage_calc_costs (calculation_id, category, description, amount)
        VALUES (${newCalcId}, ${cost.category || ""}, ${cost.description || ""}, ${cost.amount || 0})
      `
    }

    const revenues = await sql`SELECT * FROM voyage_calc_revenues WHERE calculation_id = ${calculationId}`
    for (const revenue of revenues) {
      await sql`
        INSERT INTO voyage_calc_revenues (calculation_id, type, description, amount)
        VALUES (${newCalcId}, ${revenue.type || "freight"}, ${revenue.description || ""}, ${revenue.amount || 0})
      `
    }

    return NextResponse.json({ id: newCalcId, message: "Hesap kopyalandı" }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Hesap kopyalama")
  }
}
