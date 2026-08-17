import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { checkPermission } from "@/lib/permissions"
import { listAssignableRoles } from "@/lib/authz"

/**
 * Kayıt olmuş (var olan) bir kullanıcıyı bir şirkete üye yapar / rolünü belirler.
 *
 * Yeni kullanıcı OLUŞTURMAZ; yalnızca e-posta ile bulur ve seçilen şirkete
 * atar. Böylece biri signup ile kayıt olduktan sonra yöneticisi onu kendi
 * şirketine ekleyebilir. İşlemi yapan kişinin o şirkette "ekleme" yetkisi olmalı.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentUser()
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { email, role, companyId } = await request.json()
    if (!email || !companyId) {
      return NextResponse.json({ error: "E-posta ve şirket zorunludur" }, { status: 400 })
    }

    if (!(await checkPermission(actor.id, companyId, "canCreate"))) {
      return NextResponse.json({ error: "Bu şirkete kullanıcı ekleme yetkiniz yok" }, { status: 403 })
    }

    const [target] = await sql`SELECT id, name, email FROM users WHERE lower(email) = ${String(email).toLowerCase()}`
    if (!target) {
      return NextResponse.json(
        { error: "Bu e-postayla kayıtlı bir kullanıcı yok. Önce kişinin kayıt olması gerekir." },
        { status: 404 },
      )
    }

    const allowedRoles = (await listAssignableRoles()).map((r) => r.slug)
    const assignedRole = role || "viewer"
    if (!allowedRoles.includes(assignedRole)) {
      return NextResponse.json({ error: `Geçersiz rol. İzin verilenler: ${allowedRoles.join(", ")}` }, { status: 400 })
    }

    // Üyelik: user_permissions'a ekle/güncelle (aktif).
    await sql`
      INSERT INTO user_permissions (user_id, company_id, role, is_active)
      VALUES (${target.id}, ${companyId}, ${assignedRole}, true)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET role = ${assignedRole}, is_active = true, updated_at = NOW()
    `

    return NextResponse.json({ success: true, user: target })
  } catch (error: any) {
    console.error("Error assigning user:", error)
    return NextResponse.json({ error: "Kullanıcı atanamadı" }, { status: 500 })
  }
}
