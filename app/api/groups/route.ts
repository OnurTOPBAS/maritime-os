import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds, requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Kullanıcı grupları.
 *
 * departments ile aynı kusur buradaydı: `user.companyId` alanı oturum
 * nesnesinde bulunmadığı için sorgular boş dönüyor, ekleme ise NOT NULL
 * kısıtına takılıyordu. Şirket artık üyelik üzerinden belirlenir.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const requestedCompanyId = request.nextUrl.searchParams.get("companyId")

    if (requestedCompanyId) {
      await requireCompanyAccess(user.id, requestedCompanyId, "canView")
    }

    const companyIds = requestedCompanyId
      ? [requestedCompanyId]
      : await getAccessibleCompanyIds(user.id)

    if (companyIds.length === 0) {
      return NextResponse.json([])
    }

    const groups = await sql`
      SELECT
        g.*,
        COUNT(DISTINCT ugm.user_id) as member_count
      FROM user_groups g
      LEFT JOIN user_group_members ugm ON g.id = ugm.group_id
      WHERE g.company_id = ANY(${companyIds}::uuid[])
      GROUP BY g.id
      ORDER BY g.name
    `

    return NextResponse.json(groups)
  } catch (error) {
    return handleApiError(error, "Gruplar")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name, description, companyId } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Grup adı zorunludur" }, { status: 400 })
    }

    let targetCompanyId = companyId
    if (!targetCompanyId) {
      const companyIds = await getAccessibleCompanyIds(user.id)
      if (companyIds.length === 0) {
        return NextResponse.json({ error: "Erişilebilir şirket yok" }, { status: 403 })
      }
      if (companyIds.length > 1) {
        return NextResponse.json({ error: "Şirket seçilmelidir" }, { status: 400 })
      }
      targetCompanyId = companyIds[0]
    }

    await requireCompanyAccess(user.id, targetCompanyId, "canCreate")

    const result = await sql`
      INSERT INTO user_groups (company_id, name, description)
      VALUES (${targetCompanyId}, ${name.trim()}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir grup zaten mevcut" }, { status: 400 })
    }
    return handleApiError(error, "Grup oluşturma")
  }
}
