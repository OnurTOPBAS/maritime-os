import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Excel'den toplu fixture (kiralama sözleşmesi) aktarımı.
 *
 * Her fixture bir gemiye bağlanır; kullanıcının o geminin ait olduğu şirkete
 * erişimi doğrulanır. Önceden bu kontrol yoktu: herhangi bir ship_id
 * gönderilerek başka şirketin gemisine fixture eklenebiliyordu.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { fixtures } = await request.json()

    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      return NextResponse.json({ error: "Fixture verisi gönderilmedi" }, { status: 400 })
    }

    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ error: "Erişilebilir şirket yok" }, { status: 403 })
    }

    // Erişilebilir gemiler bir kez çekilip bellekte kontrol edilir.
    const allowedShips = await sql`
      SELECT s.id FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
    `
    const allowedShipIds = new Set(allowedShips.map((r: any) => r.id))

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const fixture of fixtures) {
      if (!fixture?.charterer) {
        results.failed++
        results.errors.push("Charterer adı eksik")
        continue
      }

      if (!fixture.ship_id || !allowedShipIds.has(fixture.ship_id)) {
        results.failed++
        results.errors.push(`${fixture.charterer}: geçersiz veya erişim dışı gemi`)
        continue
      }

      try {
        await sql`
          INSERT INTO fixtures (
            charterer, ship_id, fixture_type, cargo_type, load_port,
            discharge_port, laycan_from, laycan_to, rate, rate_type,
            cp_date, status, notes
          ) VALUES (
            ${fixture.charterer}, ${fixture.ship_id},
            ${fixture.fixture_type || null}, ${fixture.cargo_type || null},
            ${fixture.load_port || null}, ${fixture.discharge_port || null},
            ${fixture.laycan_from || null}, ${fixture.laycan_to || null},
            ${fixture.rate || null}, ${fixture.rate_type || null},
            ${fixture.cp_date || null}, ${fixture.status || "fixed"},
            ${fixture.notes || null}
          )
        `
        results.success++
      } catch (error) {
        console.error(`[Fixture aktarımı] "${fixture.charterer}" eklenemedi:`, error)
        results.failed++
        results.errors.push(`${fixture.charterer}: kayıt eklenemedi`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error, "Fixture aktarımı")
  }
}
