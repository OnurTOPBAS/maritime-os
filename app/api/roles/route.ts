import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin, invalidatePermissionCache } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { uniqueSlug } from "@/lib/slug"

export async function GET() {
  try {
    // Rol listesi yetki yapılandırmasıdır; yalnızca oturum sahipleri görebilir.
    await requireAuth()

    const roles = await sql`
      SELECT r.*, COUNT(rp.id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.name
    `
    return NextResponse.json(roles)
  } catch (error) {
    return handleApiError(error, "Rol listesi")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    // Yeni rol oluşturmak sistem genelini etkiler: yönetici yetkisi şart.
    await requireSystemAdmin(user.id)

    const { name, description } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Rol adı zorunludur" }, { status: 400 })
    }

    // Slug ZORUNLUDUR: yetki eşlemesi ve rol atama listesi bu alana bakar.
    // Önceden üretilmediği için yeni oluşturulan roller hiçbir yerde
    // görünmüyordu (atama listesi slug'ı olmayan rolleri gizler).
    const existing = await sql`SELECT slug FROM roles WHERE slug IS NOT NULL`
    const slug = uniqueSlug(
      name,
      existing.map((r: any) => r.slug),
    )

    const result = await sql`
      INSERT INTO roles (name, description, is_system, slug)
      VALUES (${name.trim()}, ${description ?? null}, false, ${slug})
      RETURNING *
    `

    invalidatePermissionCache()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir rol zaten mevcut" }, { status: 400 })
    }
    return handleApiError(error, "Rol oluşturma")
  }
}
