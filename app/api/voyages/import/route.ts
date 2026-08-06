import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Excel'den toplu sefer aktarımı.
 *
 * Her sefer bir fixture'a bağlanır; kullanıcının o fixture'ın ait olduğu
 * şirkete erişimi olmadan sefer eklenemez. Önceden bu doğrulama yoktu:
 * herhangi bir fixture_id gönderilerek başka şirketin verisine sefer
 * eklenebiliyordu.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { voyages } = await request.json()

    if (!Array.isArray(voyages) || voyages.length === 0) {
      return NextResponse.json({ error: "Sefer verisi gönderilmedi" }, { status: 400 })
    }

    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ error: "Erişilebilir şirket yok" }, { status: 403 })
    }

    // Kullanıcının erişebildiği fixture'lar bir kez çekilir; her satırda
    // ayrı sorgu atmak yerine bellekte kontrol edilir.
    const allowedFixtures = await sql`
      SELECT fx.id FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
    `
    const allowedFixtureIds = new Set(allowedFixtures.map((r: any) => r.id))

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const voyage of voyages) {
      if (!voyage?.voyage_number) {
        results.failed++
        results.errors.push("Sefer numarası eksik")
        continue
      }

      if (!voyage.fixture_id || !allowedFixtureIds.has(voyage.fixture_id)) {
        results.failed++
        results.errors.push(`${voyage.voyage_number}: geçersiz veya erişim dışı fixture`)
        continue
      }

      try {
        await sql`
          INSERT INTO voyages (
            voyage_number, fixture_id, load_port, discharge_port,
            eta_load, etd_load, eta_discharge, etd_discharge,
            cargo_quantity, cargo_unit, status, notes
          ) VALUES (
            ${voyage.voyage_number}, ${voyage.fixture_id},
            ${voyage.load_port || null}, ${voyage.discharge_port || null},
            ${voyage.eta_load || null}, ${voyage.etd_load || null},
            ${voyage.eta_discharge || null}, ${voyage.etd_discharge || null},
            ${voyage.cargo_quantity || null}, ${voyage.cargo_unit || null},
            ${voyage.status || "planned"}, ${voyage.notes || null}
          )
        `
        results.success++
      } catch (error) {
        console.error(`[Sefer aktarımı] "${voyage.voyage_number}" eklenemedi:`, error)
        results.failed++
        results.errors.push(`${voyage.voyage_number}: kayıt eklenemedi`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error, "Sefer aktarımı")
  }
}
