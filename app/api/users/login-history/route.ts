import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { sql } from "@/lib/db"
import { handleApiError } from "@/lib/api-error"

/**
 * Kullanıcının oturum/giriş geçmişi.
 *
 * Düzeltmeler:
 *  - Sorgu var olmayan sütunları (last_activity, is_active) okuyordu; doğrusu
 *    last_active. Bu yüzden rota her istekte 500 veriyordu.
 *  - userId parametresi doğrudan kullanılıyordu: herkes bir başkasının giriş
 *    geçmişini (IP adresleri dâhil) görebiliyordu. Artık başkasının geçmişi
 *    yalnızca yöneticilere açıktır.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get("userId")

    if (requestedUserId && requestedUserId !== user.id) {
      await requireSystemAdmin(user.id)
    }
    const targetUserId = requestedUserId ?? user.id

    const rawLimit = Number.parseInt(searchParams.get("limit") ?? "50", 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50

    const sessions = await sql`
      SELECT
        id,
        user_id,
        ip_address,
        user_agent,
        created_at,
        expires_at,
        last_active,
        (expires_at > NOW()) AS is_active
      FROM user_sessions
      WHERE user_id = ${targetUserId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(sessions)
  } catch (error) {
    return handleApiError(error, "Giriş geçmişi")
  }
}
