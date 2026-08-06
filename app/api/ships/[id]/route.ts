import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireShipAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { logActivity } from "@/lib/audit-logger"

const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Geçersiz gemi kimliği" }, { status: 400 })
    }

    // Merkezi yetki katmanı hem user_permissions hem company_team_members
    // tablolarına bakar. Önceki satır-içi sorgu yalnızca company_team_members'ı
    // kontrol ediyordu; bu yüzden Kullanıcılar ekranından (user_permissions'a)
    // eklenen üyeler gemiyi göremiyordu.
    await requireShipAccess(user.id, id, "canView")

    const ships = await sql`SELECT * FROM ships WHERE id = ${id}`
    if (ships.length === 0) {
      return NextResponse.json({ error: "Gemi bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ ship: ships[0] })
  } catch (error) {
    return handleApiError(error, "Gemi getirme")
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Geçersiz gemi kimliği" }, { status: 400 })
    }

    // Düzenleme yetkisi merkezi katmandan doğrulanır (viewer düzenleyemez).
    await requireShipAccess(user.id, id, "canEdit")

    const oldData = await sql`SELECT * FROM ships WHERE id = ${id}`
    const prev = oldData[0]

    // KISMİ GÜNCELLEME: Yalnızca gönderilen alanlar değişir, gönderilmeyenler
    // eski değerini korur. Önceden gövdede olmayan her alan için `undefined`
    // yazılıyordu; postgres sürücüsü undefined'ı reddettiği için basit bir ad
    // güncellemesi bile tüm isteği çökertiyordu.
    const pick = (key: string) => (body[key] === undefined ? prev[key] : body[key])

    // JSONB alanları: gönderildiyse serileştir, yoksa eskiyi olduğu gibi bırak.
    const jsonb = (key: string) =>
      body[key] === undefined ? prev[key] : body[key] ? JSON.stringify(body[key]) : null

    const result = await sql`
      UPDATE ships SET
        name = ${pick("name")},
        imo_number = ${pick("imo_number")},
        flag = ${pick("flag")},
        vessel_type = ${pick("vessel_type")},
        dwt = ${pick("dwt")},
        built_year = ${pick("built_year")},
        status = ${pick("status")},
        grt = ${pick("grt")},
        nrt = ${pick("nrt")},
        main_engine = ${pick("main_engine")},
        engine_power = ${pick("engine_power")},
        speed_laden = ${pick("speed_laden")},
        speed_ballast = ${pick("speed_ballast")},
        loa = ${pick("loa")},
        beam = ${pick("beam")},
        draft = ${pick("draft")},
        current_position = ${pick("current_position")},
        latitude = ${pick("latitude")},
        longitude = ${pick("longitude")},
        position_updated_at = ${pick("position_updated_at")},
        consumption_operations = ${jsonb("consumption_operations")}::jsonb,
        consumption_laden_speed = ${jsonb("consumption_laden_speed")}::jsonb,
        consumption_ballast_speed = ${jsonb("consumption_ballast_speed")}::jsonb,
        particulars_file_url = ${pick("particulars_file_url")},
        fuel_consumption_file_url = ${pick("fuel_consumption_file_url")},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    await logActivity({
      userId: user.id,
      entityType: "ship",
      entityId: id,
      action: "update",
      changes: { before: oldData[0], after: result[0] },
    })

    return NextResponse.json({ ship: result[0] })
  } catch (error) {
    return handleApiError(error, "Gemi güncelleme")
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Geçersiz gemi kimliği" }, { status: 400 })
    }

    // Silme yetkisi merkezi katmandan doğrulanır (yalnızca admin siler).
    await requireShipAccess(user.id, id, "canDelete")

    const oldData = await sql`SELECT * FROM ships WHERE id = ${id}`

    await sql`DELETE FROM ships WHERE id = ${id}`

    await logActivity({
      userId: user.id,
      entityType: "ship",
      entityId: id,
      action: "delete",
      changes: { before: oldData[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Gemi silme")
  }
}
