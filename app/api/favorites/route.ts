import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

/**
 * Kullanıcının favori kayıtları.
 *
 * recent-items ile aynı iki sorun buradaydı: kendi API'sine HTTP isteği ve
 * yanlış okunan kullanıcı kimliği (user.id daima undefined). İkisi de giderildi;
 * ayrıca dinamik SQL metni yerine parametreli sorgular kullanılıyor.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const type = request.nextUrl.searchParams.get("type")

    const favorites = await sql`
      SELECT * FROM favorites
      WHERE user_id = ${user.id}
        AND (${type ?? null}::text IS NULL OR entity_type = ${type ?? null}::text)
      ORDER BY created_at DESC
    `

    return NextResponse.json(favorites)
  } catch (error) {
    return handleApiError(error, "Favoriler")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { entityType, entityId } = await request.json()

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType ve entityId zorunludur" }, { status: 400 })
    }

    await sql`
      INSERT INTO favorites (user_id, entity_type, entity_id)
      VALUES (${user.id}, ${entityType}, ${entityId})
      ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING
    `

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Favori ekleme")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id) {
      return NextResponse.json({ error: "type ve id zorunludur" }, { status: 400 })
    }

    await sql`
      DELETE FROM favorites
      WHERE user_id = ${user.id} AND entity_type = ${type} AND entity_id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Favori silme")
  }
}
