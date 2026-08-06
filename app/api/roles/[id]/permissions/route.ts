import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin, invalidatePermissionCache } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    const permissions = await sql`
      SELECT p.*
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ${id}
      ORDER BY p.module, p.action
    `
    return NextResponse.json(permissions)
  } catch (error) {
    return handleApiError(error, "Rol izinleri")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    // Bir rolün izinlerini değiştirmek tüm sistemi etkiler.
    await requireSystemAdmin(user.id)
    const { id } = await params

    const { permissionIds } = await request.json()

    if (permissionIds !== undefined && !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds bir dizi olmalıdır" }, { status: 400 })
    }

    // Sistem rollerinin izinleri sabittir; değiştirilirse yetki modeli bozulur.
    const roleCheck = await sql`SELECT is_system FROM roles WHERE id = ${id}`
    if (roleCheck.length === 0) {
      return NextResponse.json({ error: "Rol bulunamadı" }, { status: 404 })
    }
    if (roleCheck[0].is_system) {
      return NextResponse.json({ error: "Sistem rollerinin izinleri değiştirilemez" }, { status: 403 })
    }

    await sql`DELETE FROM role_permissions WHERE role_id = ${id}`

    if (permissionIds && permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        await sql`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (${id}, ${permissionId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // İzinler değişti: önbellek temizlenmezse 30 saniyeye kadar eski
    // yetkiler geçerli kalırdı.
    invalidatePermissionCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Rol izinleri güncelleme")
  }
}
