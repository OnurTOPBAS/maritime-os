import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds, requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Departmanlar.
 *
 * Kritik düzeltme: Sorgular `user.companyId` alanını kullanıyordu; oturum
 * nesnesinde ({ id, email, name }) böyle bir alan yok. Değer daima undefined
 * kaldığı için `WHERE company_id = NULL` koşulu hiçbir kaydı döndürmüyor,
 * INSERT ise NOT NULL kısıtına takılıyordu. Yani departman özelliği hiç
 * çalışmamıştı. Şirket artık üyelik üzerinden belirlenir.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // İstemci belirli bir şirket isteyebilir; aksi halde erişilen tüm
    // şirketlerin departmanları listelenir.
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

    const departments = await sql`
      SELECT
        d.id,
        d.name,
        d.description,
        d.company_id,
        d.created_at,
        COUNT(u.id) as member_count
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      WHERE d.company_id = ANY(${companyIds}::uuid[])
      GROUP BY d.id
      ORDER BY d.name
    `

    return NextResponse.json(departments)
  } catch (error) {
    return handleApiError(error, "Departmanlar")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name, description, companyId } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Departman adı zorunludur" }, { status: 400 })
    }

    // Şirket belirtilmediyse kullanıcının tek şirketi varsayılır.
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
      INSERT INTO departments (company_id, name, description)
      VALUES (${targetCompanyId}, ${name.trim()}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir departman zaten mevcut" }, { status: 400 })
    }
    return handleApiError(error, "Departman oluşturma")
  }
}
