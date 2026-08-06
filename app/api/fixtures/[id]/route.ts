import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireResourceAccess, resolveFixtureCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Tek fixture getirir.
 *
 * Bu handler eksikti: arayüz veya API tüketicisi /api/fixtures/{id} çağırınca
 * 405 (Method Not Allowed) alıyordu, yani tekil fixture görüntüleme hiç
 * çalışmıyordu.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    await requireResourceAccess(user.id, resolveFixtureCompany, id, "fixtures", "view", "Fixture bulunamadı")

    const rows = await sql`
      SELECT fx.*, s.name AS ship_name, s.imo_number, fl.name AS fleet_name
      FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      WHERE fx.id = ${id}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Fixture bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ fixture: rows[0] })
  } catch (error) {
    return handleApiError(error, "Fixture getirme")
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveFixtureCompany, id, "fixtures", "delete", "Fixture bulunamadı")

    await sql`DELETE FROM fixtures WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Fixture silme")
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveFixtureCompany, id, "fixtures", "edit", "Fixture bulunamadı")

    const loadPortJson = Array.isArray(body.load_port) ? JSON.stringify(body.load_port) : body.load_port
    const dischargePortJson = Array.isArray(body.discharge_port)
      ? JSON.stringify(body.discharge_port)
      : body.discharge_port

    const result = await sql`
      UPDATE fixtures SET
        fixture_type = ${body.fixture_type || null},
        charterer = ${body.charterer},
        cargo_type = ${body.cargo_type},
        rate = ${body.rate},
        rate_type = ${body.rate_type},
        cp_date = ${body.cp_date},
        laycan_from = ${body.laycan_from},
        laycan_to = ${body.laycan_to},
        load_port = ${loadPortJson},
        discharge_port = ${dischargePortJson},
        demurrage_rate = ${body.demurrage_rate},
        payment_type = ${body.payment_type || null},
        status = ${body.status},
        notes = ${body.notes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ fixture: result[0] })
  } catch (error) {
    return handleApiError(error, "Fixture güncelleme")
  }
}
