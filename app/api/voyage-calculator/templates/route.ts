import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

/**
 * Sefer hesaplayıcı şablonları (kullanıcıya özel).
 *
 * Kritik düzeltme: Bu rota next-auth'un getServerSession() fonksiyonunu
 * kullanıyordu. Uygulama ise kendi JWT/çerez tabanlı oturum sistemini
 * kullanır ve next-auth yapılandırılmamıştır; dolayısıyla oturum daima boş
 * dönüyor ve rota her istekte 401 veriyordu. Yani şablon özelliği hiç
 * çalışmamıştı.
 */
export async function GET() {
  try {
    const user = await requireAuth()

    const templates = await sql`
      SELECT id, name, description, ship_name, created_at
      FROM voyage_calc_templates
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json(templates)
  } catch (error) {
    return handleApiError(error, "Şablon listesi")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    if (!body?.name) {
      return NextResponse.json({ error: "Şablon adı zorunludur" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO voyage_calc_templates (
        user_id, name, description, ship_id, ship_name, service_speed, running_cost_per_day,
        fuel_consumption, fo_price, mgo_price, legs, operations, cost_items
      ) VALUES (
        ${user.id}, ${body.name}, ${body.description || ""}, ${body.ship_id || null},
        ${body.ship_name || null}, ${body.service_speed || null}, ${body.running_cost_per_day || null},
        ${JSON.stringify(body.fuel_consumption || {})},
        ${body.fo_price || null}, ${body.mgo_price || null},
        ${JSON.stringify(body.legs || [])},
        ${JSON.stringify(body.operations || {})}, ${JSON.stringify(body.cost_items || [])}
      )
      RETURNING id
    `

    return NextResponse.json({ id: result[0].id, message: "Şablon oluşturuldu" }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Şablon oluşturma")
  }
}
