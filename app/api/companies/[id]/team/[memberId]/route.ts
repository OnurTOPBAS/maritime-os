import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCompanyAccess, listAssignableRoles } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

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

/**
 * Üyenin gerçekten BU şirkete ait olduğunu doğrular.
 *
 * Kritik: Bu kontrol olmadan saldırgan, erişimi olan bir şirketin id'sini
 * kullanıp başka bir şirkete ait memberId göndererek o kaydı silebilirdi (IDOR).
 */
async function getMemberInCompany(companyId: string, memberId: string) {
  const [member] = await sql`
    SELECT id, user_id, role FROM company_team_members
    WHERE id = ${memberId} AND company_id = ${companyId}
  `
  return member ?? null
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const user = await requireAuth()
    const { id: companyId, memberId } = await params

    // Üye çıkarmak yıkıcı bir işlem: yalnızca admin yapabilir.
    await requireCompanyAccess(user.id, companyId, "canDelete")

    const member = await getMemberInCompany(companyId, memberId)
    if (!member) {
      return NextResponse.json({ error: "Ekip üyesi bulunamadı" }, { status: 404 })
    }

    // Şirket sahibi ekipten çıkarılamaz, aksi halde şirket sahipsiz kalır.
    const [owner] = await sql`
      SELECT 1 FROM companies WHERE id = ${companyId} AND owner_id = ${member.user_id}
    `
    if (owner) {
      return NextResponse.json({ error: "Şirket sahibi ekipten çıkarılamaz" }, { status: 400 })
    }

    await sql`
      DELETE FROM company_team_members
      WHERE id = ${memberId} AND company_id = ${companyId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Ekip üyesi silme")
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const user = await requireAuth()
    const { id: companyId, memberId } = await params

    // Rol değiştirmek yetki devri demektir: yalnızca admin yapabilir.
    await requireCompanyAccess(user.id, companyId, "canDelete")

    const { role } = await request.json()

    let validRole: string
    try {
      validRole = await assertValidRole(role)
    } catch (roleError) {
      if (roleError instanceof InvalidRoleError) {
        return NextResponse.json({ error: roleError.message }, { status: 400 })
      }
      throw roleError
    }

    const member = await getMemberInCompany(companyId, memberId)
    if (!member) {
      return NextResponse.json({ error: "Ekip üyesi bulunamadı" }, { status: 404 })
    }

    // Şirket sahibinin rolü düşürülemez.
    const [owner] = await sql`
      SELECT 1 FROM companies WHERE id = ${companyId} AND owner_id = ${member.user_id}
    `
    if (owner) {
      return NextResponse.json({ error: "Şirket sahibinin rolü değiştirilemez" }, { status: 400 })
    }

    const [updated] = await sql`
      UPDATE company_team_members
      SET role = ${validRole}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId} AND company_id = ${companyId}
      RETURNING *
    `

    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error, "Ekip üyesi güncelleme")
  }
}
