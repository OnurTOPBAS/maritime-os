import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Excel'den toplu gemi aktarımı.
 *
 * Düzeltilen sorunlar:
 *  - Kullanıcı, kendi /api/auth/me uç noktasına HTTP isteğiyle çözülüyordu
 *    (gereksiz ağ turu, kırılgan kalıp); artık oturum doğrudan okunuyor.
 *  - Hedef filoya erişim doğrulanmıyordu: kullanıcı herhangi bir fleetId
 *    göndererek başka şirketin filosuna gemi ekleyebiliyordu.
 *  - Veritabanı hata mesajları istemciye aynen aktarılıyordu (bilgi sızıntısı).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { ships, fleetId } = await request.json()

    if (!Array.isArray(ships) || ships.length === 0) {
      return NextResponse.json({ error: "Gemi verisi gönderilmedi" }, { status: 400 })
    }

    if (!fleetId) {
      return NextResponse.json({ error: "Filo seçilmelidir" }, { status: 400 })
    }

    // Filonun hangi şirkete ait olduğu bulunup yazma yetkisi doğrulanır.
    const [fleet] = await sql`SELECT company_id FROM fleets WHERE id = ${fleetId}`
    if (!fleet) {
      return NextResponse.json({ error: "Filo bulunamadı" }, { status: 404 })
    }
    await requireCompanyAccess(user.id, fleet.company_id, "canCreate")

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const ship of ships) {
      if (!ship?.name) {
        results.failed++
        results.errors.push("Gemi adı eksik")
        continue
      }

      try {
        await sql`
          INSERT INTO ships (
            name, imo_number, flag, vessel_type, dwt, grt, nrt,
            built_year, loa, beam, draft, main_engine, engine_power,
            speed_laden, speed_ballast, status, current_position, fleet_id
          ) VALUES (
            ${ship.name}, ${ship.imo_number || null}, ${ship.flag || null},
            ${ship.vessel_type || null}, ${ship.dwt || null}, ${ship.grt || null},
            ${ship.nrt || null}, ${ship.built_year || null}, ${ship.loa || null},
            ${ship.beam || null}, ${ship.draft || null}, ${ship.main_engine || null},
            ${ship.engine_power || null}, ${ship.speed_laden || null},
            ${ship.speed_ballast || null}, ${ship.status || "active"},
            ${ship.current_position || null}, ${fleetId}
          )
        `
        results.success++
      } catch (error) {
        // Ayrıntı sunucuya loglanır; kullanıcıya yalnızca hangi satırın
        // aktarılamadığı bildirilir.
        console.error(`[Gemi aktarımı] "${ship.name}" eklenemedi:`, error)
        results.failed++
        results.errors.push(`${ship.name}: kayıt eklenemedi`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error, "Gemi aktarımı")
  }
}
