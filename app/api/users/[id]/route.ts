import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { checkPermission } from "@/lib/permissions"
import { listAssignableRoles, isSuperAdmin } from "@/lib/authz"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"

/** Hedef kullanıcı bu şirkette üye mi (sahip / user_permissions / team member)? */
async function isMember(userId: string, companyId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM companies WHERE id = ${companyId} AND owner_id = ${userId}
    UNION ALL
    SELECT 1 FROM user_permissions WHERE user_id = ${userId} AND company_id = ${companyId} AND is_active = true
    UNION ALL
    SELECT 1 FROM company_team_members WHERE user_id = ${userId} AND company_id = ${companyId}
    LIMIT 1
  `
  return rows.length > 0
}

async function isOwner(userId: string, companyId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM companies WHERE id = ${companyId} AND owner_id = ${userId}`
  return rows.length > 0
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getCurrentUser()
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const targetId = (await params).id
    const body = await request.json()
    const { name, email, role, companyId, password } = body

    if (!companyId) return NextResponse.json({ error: "Company ID required" }, { status: 400 })

    const superAdmin = await isSuperAdmin(actor.id)

    // Yetki: bu şirkette düzenleme.
    if (!superAdmin && !(await checkPermission(actor.id, companyId, "canEdit"))) {
      return NextResponse.json({ error: "Bu şirkette düzenleme yetkiniz yok" }, { status: 403 })
    }

    // Hedef kullanıcı bu şirkete ait olmalı — başka şirketin çalışanına dokunulamaz.
    if (!superAdmin && !(await isMember(targetId, companyId))) {
      return NextResponse.json({ error: "Bu kullanıcı bu şirkette değil" }, { status: 403 })
    }

    // Şirket sahibi, süper yönetici dışında kimse tarafından düzenlenemez
    // (kendisi hariç). Manager, owner/admin'i değiştiremez.
    if (!superAdmin && targetId !== actor.id && (await isOwner(targetId, companyId))) {
      return NextResponse.json({ error: "Şirket sahibi düzenlenemez" }, { status: 403 })
    }

    if (email) {
      const currentUser = await sql`SELECT email FROM users WHERE id = ${targetId}`
      if (currentUser[0]?.email !== email) {
        const existingUser = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${targetId}`
        if (existingUser.length > 0) {
          return NextResponse.json({ error: "Bu email adresi zaten kullanılıyor" }, { status: 400 })
        }
      }
    }

    if (name || email) {
      await sql`
        UPDATE users
        SET name = COALESCE(${name}, name),
            email = COALESCE(${email}, email),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${targetId}
      `
    }

    if (password) {
      // Başka bir kullanıcının şifresini yalnızca süper yönetici değiştirebilir.
      // Şirket admini/yöneticisi bile başkasının şifresini sıfırlayamaz (hesap
      // ele geçirme riski). Herkes yalnızca KENDİ şifresini değiştirebilir.
      if (!superAdmin && targetId !== actor.id) {
        return NextResponse.json(
          { error: "Başka bir kullanıcının şifresini yalnızca süper yönetici değiştirebilir" },
          { status: 403 },
        )
      }
      const passwordHash = await bcrypt.hash(password, 12)
      await sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP WHERE id = ${targetId}`
    }

    if (role !== undefined) {
      const allowed = (await listAssignableRoles()).map((r) => r.slug)
      if (!allowed.includes(role)) {
        return NextResponse.json({ error: `Geçersiz rol. İzin verilenler: ${allowed.join(", ")}` }, { status: 400 })
      }
      await sql`
        INSERT INTO user_permissions (user_id, company_id, role, is_active)
        VALUES (${targetId}, ${companyId}, ${role}, true)
        ON CONFLICT (user_id, company_id)
        DO UPDATE SET role = EXCLUDED.role, is_active = true, updated_at = CURRENT_TIMESTAMP
      `
      // Aynı rolü team-member kaydında da güncelle (varsa) ki tutarlı olsun.
      await sql`
        UPDATE company_team_members SET role = ${role}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${targetId} AND company_id = ${companyId}
      `
    }

    const updatedUser = await sql`
      SELECT u.id, u.name, u.email, u.created_at,
        COALESCE(up.role, ctm.role) as permission_role
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id AND up.company_id = ${companyId}
      LEFT JOIN company_team_members ctm ON u.id = ctm.user_id AND ctm.company_id = ${companyId}
      WHERE u.id = ${targetId}
    `
    return NextResponse.json(updatedUser[0])
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getCurrentUser()
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const targetId = (await params).id
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    if (!companyId) return NextResponse.json({ error: "Company ID required" }, { status: 400 })

    const superAdmin = await isSuperAdmin(actor.id)

    if (!superAdmin && !(await checkPermission(actor.id, companyId, "canDelete"))) {
      return NextResponse.json({ error: "Bu şirkette silme yetkiniz yok" }, { status: 403 })
    }

    // Şirket sahibi çıkarılamaz.
    if (await isOwner(targetId, companyId)) {
      return NextResponse.json({ error: "Şirket sahibi çıkarılamaz" }, { status: 400 })
    }

    // Yalnızca bu şirketteki üyeliği kaldırılır (kullanıcı hesabı silinmez).
    // Her iki üyelik tablosundan da temizlenir.
    await sql`DELETE FROM user_permissions WHERE user_id = ${targetId} AND company_id = ${companyId}`
    await sql`DELETE FROM company_team_members WHERE user_id = ${targetId} AND company_id = ${companyId}`

    return NextResponse.json({ message: "User removed from company" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
