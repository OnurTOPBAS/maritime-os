import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

/**
 * Kullanıcının son görüntülediği kayıtlar.
 *
 * Düzeltilen iki sorun:
 *  1) Bu rota kullanıcıyı öğrenmek için kendi /api/auth/me uç noktasına HTTP
 *     isteği atıyordu. Gereksiz bir ağ turu ve kırılgan bir kalıptı; artık
 *     oturum doğrudan okunuyor.
 *  2) /api/auth/me yanıtı { user: {...} } biçimindeyken kod user.id okuyordu;
 *     değer daima undefined kalıyor ve sorgu WHERE user_id = NULL'a dönüşerek
 *     her zaman boş sonuç veriyordu. Yani özellik hiç çalışmamıştı.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const rawLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10

    const recentItems = await sql`
      SELECT * FROM recent_items
      WHERE user_id = ${user.id}
      ORDER BY viewed_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(recentItems)
  } catch (error) {
    return handleApiError(error, "Son görüntülenenler")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { entityType, entityId, entityName } = await request.json()

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType ve entityId zorunludur" }, { status: 400 })
    }

    await sql`
      INSERT INTO recent_items (user_id, entity_type, entity_id, entity_name, viewed_at)
      VALUES (${user.id}, ${entityType}, ${entityId}, ${entityName ?? null}, NOW())
      ON CONFLICT (user_id, entity_type, entity_id)
      DO UPDATE SET viewed_at = NOW(), entity_name = ${entityName ?? null}
    `

    // Kullanıcı başına yalnızca son 50 kayıt tutulur.
    await sql`
      DELETE FROM recent_items
      WHERE user_id = ${user.id}
      AND id NOT IN (
        SELECT id FROM recent_items
        WHERE user_id = ${user.id}
        ORDER BY viewed_at DESC
        LIMIT 50
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Son görüntülenen kaydetme")
  }
}
