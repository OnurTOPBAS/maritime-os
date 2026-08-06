import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { canAccessCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { validateShip } from "@/lib/validation"

/**
 * Toplu gemi aktarımı (data-importer bileşeni tarafından kullanılır).
 *
 * Düzeltilen sorunlar:
 *  - validateShip() bir ValidationError DİZİSİ döndürür; kod ise
 *    `validation.valid` ve `validation.errors` bekliyordu. `valid` daima
 *    undefined olduğu için HER gemi doğrulamadan kalıyor ve aktarım hiç
 *    çalışmıyordu.
 *  - INSERT ifadesi `ship_type` sütununa yazıyordu; tabloda böyle bir sütun
 *    yok (doğrusu `vessel_type`), yani kayıt eklense bile hata verirdi.
 *  - Erişim yalnızca şirket sahibine açıktı; ekip üyeleri aktarım yapamıyordu.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    const { ships } = await request.json()

    if (!Array.isArray(ships) || ships.length === 0) {
      return NextResponse.json({ error: "Gemi verisi gönderilmedi" }, { status: 400 })
    }

    const results = { success: 0, failed: 0, errors: [] as any[] }

    // Aynı filo tekrar tekrar sorgulanmasın diye sonuçlar önbelleklenir.
    const fleetAccess = new Map<string, boolean>()

    for (const ship of ships) {
      try {
        const validationErrors = validateShip(ship)
        if (validationErrors.length > 0) {
          results.failed++
          results.errors.push({
            row: ship,
            error: validationErrors.map((e) => e.message).join(", "),
          })
          continue
        }

        if (!ship.fleet_id) {
          results.failed++
          results.errors.push({ row: ship, error: "Filo belirtilmedi" })
          continue
        }

        let allowed = fleetAccess.get(ship.fleet_id)
        if (allowed === undefined) {
          const [fleet] = await sql`SELECT company_id FROM fleets WHERE id = ${ship.fleet_id}`
          allowed = fleet ? await canAccessCompany(user.id, fleet.company_id, "canCreate") : false
          fleetAccess.set(ship.fleet_id, allowed)
        }

        if (!allowed) {
          results.failed++
          results.errors.push({ row: ship, error: "Filo bulunamadı veya erişim yetkiniz yok" })
          continue
        }

        if (ship.imo_number) {
          const existing = await sql`
            SELECT id FROM ships WHERE imo_number = ${ship.imo_number}
          `
          if (existing.length > 0) {
            results.failed++
            results.errors.push({
              row: ship,
              error: `IMO numarası ${ship.imo_number} zaten kayıtlı`,
            })
            continue
          }
        }

        await sql`
          INSERT INTO ships (
            fleet_id, name, imo_number, flag, vessel_type, dwt, built_year, status
          ) VALUES (
            ${ship.fleet_id}, ${ship.name}, ${ship.imo_number || null}, ${ship.flag || null},
            ${ship.vessel_type || ship.ship_type || null}, ${ship.dwt || null},
            ${ship.built_year || null}, ${ship.status || "active"}
          )
        `

        results.success++
      } catch (error) {
        console.error(`[Gemi aktarımı] "${ship?.name}" eklenemedi:`, error)
        results.failed++
        results.errors.push({ row: ship, error: "Kayıt eklenemedi" })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error, "Gemi aktarımı")
  }
}
