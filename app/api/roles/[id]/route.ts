import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin, invalidatePermissionCache } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { uniqueSlug } from "@/lib/slug"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    const result = await sql`
      SELECT * FROM roles WHERE id = ${id}
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Rol bulunamadı" }, { status: 404 })
    }
    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Rol getirme")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await requireSystemAdmin(user.id)
    const { id } = await params

    const { name, description } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Rol adı zorunludur" }, { status: 400 })
    }

    // Sistem rolleri (admin/manager/viewer) değiştirilemez.
    const roleCheck = await sql`SELECT is_system FROM roles WHERE id = ${id}`
    if (roleCheck.length > 0 && roleCheck[0].is_system) {
      return NextResponse.json({ error: "Sistem rolleri düzenlenemez" }, { status: 403 })
    }

    // Slug rol adından türetilir ama ADA BAĞLI KALMAZ: bir kez atandıktan
    // sonra sabit kalır, çünkü izin eşlemeleri ona bağlıdır. Yalnızca eksikse
    // (eski kayıtlar) üretilir.
    const [current] = await sql`SELECT slug FROM roles WHERE id = ${id}`
    let slug = current?.slug ?? null

    if (!slug) {
      const existing = await sql`SELECT slug FROM roles WHERE slug IS NOT NULL AND id <> ${id}`
      slug = uniqueSlug(name, existing.map((r: any) => r.slug))
    }

    const result = await sql`
      UPDATE roles
      SET name = ${name.trim()}, description = ${description ?? null},
          slug = ${slug}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    invalidatePermissionCache()

    if (result.length === 0) {
      return NextResponse.json({ error: "Rol bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Rol güncelleme")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await requireSystemAdmin(user.id)
    const { id } = await params

    const roleCheck = await sql`SELECT is_system FROM roles WHERE id = ${id}`
    if (roleCheck.length > 0 && roleCheck[0].is_system) {
      return NextResponse.json({ error: "Sistem rolleri silinemez" }, { status: 403 })
    }

    await sql`DELETE FROM roles WHERE id = ${id}`
    invalidatePermissionCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Rol silme")
  }
}
