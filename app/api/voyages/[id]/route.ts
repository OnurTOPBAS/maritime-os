import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"
import { requireResourceAccess, resolveVoyageCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"


function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid voyage ID format" }, { status: 404 })
    }


    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveVoyageCompany, id, "voyages", "view", "Sefer bulunamadı")

    const result = await sql`
      SELECT v.*, f.charterer, s.name as ship_name, s.imo_number
      FROM voyages v
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      WHERE v.id = ${id}
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Sefer bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Sefer getirme")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid voyage ID format" }, { status: 400 })
    }


    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveVoyageCompany, id, "voyages", "edit", "Sefer bulunamadı")

    const result = await sql`
      UPDATE voyages SET
        voyage_number = ${body.voyage_number},
        status = ${body.status},
        load_port = ${body.load_port},
        load_country = ${body.load_country},
        eta_load = ${body.eta_load},
        etb_load = ${body.etb_load},
        etc_load = ${body.etc_load},
        etd_load = ${body.etd_load},
        discharge_port = ${body.discharge_port},
        discharge_country = ${body.discharge_country},
        eta_discharge = ${body.eta_discharge},
        etb_discharge = ${body.etb_discharge},
        etc_discharge = ${body.etc_discharge},
        etd_discharge = ${body.etd_discharge},
        cargo_quantity = ${body.cargo_quantity},
        cargo_unit = ${body.cargo_unit},
        laytime_allowed_load = ${body.laytime_allowed_load},
        laytime_used_load = ${body.laytime_used_load},
        laytime_allowed_discharge = ${body.laytime_allowed_discharge},
        laytime_used_discharge = ${body.laytime_used_discharge},
        demurrage_amount = ${body.demurrage_amount},
        despatch_amount = ${body.despatch_amount},
        notes = ${body.notes},
        loading_ports = ${JSON.stringify(body.loading_ports || [])},
        discharge_ports = ${JSON.stringify(body.discharge_ports || [])},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Voyage not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Sefer güncelleme")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid voyage ID format" }, { status: 400 })
    }


    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveVoyageCompany, id, "voyages", "delete", "Sefer bulunamadı")

    await sql`DELETE FROM voyages WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Sefer silme")
  }
}
