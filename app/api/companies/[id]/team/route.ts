import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCompanyAccess, listAssignableRoles } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/** Ekip üyesine atanabilecek roller. Serbest metin kabul edilmez. */
/**
 * Rol geçerliliği veritabanındaki roles tablosundan doğrulanır.
 * Önceden sabit bir liste vardı ve yalnızca admin/manager/viewer kabul
 * ediliyordu; bu yüzden Operations/Technical/Finance Manager gibi tanımlı
 * roller ekip üyesine atanamıyordu.
 */
async function assertValidRole(role: unknown): Promise<string> {
  const roles = await listAssignableRoles()
  const slugs = roles.map((r) => r.slug)

  if (typeof role !== "string" || !slugs.includes(role)) {
    throw new InvalidRoleError(slugs)
  }

  return role
}

class InvalidRoleError extends Error {
  constructor(readonly allowed: string[]) {
    super(`Geçersiz rol. İzin verilenler: ${allowed.join(", ")}`)
    this.name = "InvalidRoleError"
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id: companyId } = await params

    // Sadece şirkete erişimi olanlar ekip listesini görebilir.
    await requireCompanyAccess(user.id, companyId, "canView")

    const teamMembers = await sql`
      SELECT
        ctm.id,
        ctm.user_id,
        ctm.role,
        ctm.created_at,
        u.name,
        u.email,
        u.image,
        added_by_user.name as added_by_name
      FROM company_team_members ctm
      JOIN users u ON ctm.user_id = u.id
      LEFT JOIN users added_by_user ON ctm.added_by = added_by_user.id
      WHERE ctm.company_id = ${companyId}
      ORDER BY ctm.created_at DESC
    `

    return NextResponse.json(teamMembers)
  } catch (error) {
    return handleApiError(error, "Ekip listesi")
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id: companyId } = await params

    // Ekibe üye eklemek bir yönetim işlemidir: viewer yapamaz.
    await requireCompanyAccess(user.id, companyId, "canCreate")

    const { userId, role } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId zorunludur" }, { status: 400 })
    }

    // Rol allow-list'e karşı doğrulanır; aksi halde herkes kendini
    // istediği role (örn. admin) atayabilirdi.
    let validRole: string
    try {
      validRole = await assertValidRole(role)
    } catch (roleError) {
      if (roleError instanceof InvalidRoleError) {
        return NextResponse.json({ error: roleError.message }, { status: 400 })
      }
      throw roleError
    }

    // Yalnızca admin, başka birine admin rolü verebilir.
    if (role === "admin") {
      await requireCompanyAccess(user.id, companyId, "canDelete")
    }

    const [existing] = await sql`
      SELECT id FROM company_team_members
      WHERE company_id = ${companyId} AND user_id = ${userId}
    `

    if (existing) {
      return NextResponse.json({ error: "Kullanıcı zaten ekip üyesi" }, { status: 400 })
    }

    const [teamMember] = await sql`
      INSERT INTO company_team_members (company_id, user_id, role, added_by)
      VALUES (${companyId}, ${userId}, ${validRole}, ${user.id})
      RETURNING *
    `

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Ekip üyesi ekleme")
  }
}
