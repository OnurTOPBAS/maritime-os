import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

/**
 * Bildirimi okundu olarak işaretler.
 *
 * Önceki hali yalnızca { success: true } döndürüyordu; veritabanında hiçbir
 * şey güncellenmiyordu, yani bildirim "okundu" olmuyordu. Ayrıca güncelleme
 * kullanıcıya bağlanır: kimse başkasının bildirimini işaretleyemez.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const result = await sql`
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Bildirim bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Bildirim okundu işaretleme")
  }
}
