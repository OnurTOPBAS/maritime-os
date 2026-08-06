import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds, canAccessCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    // Belirli bir şirket istendiyse ona erişim doğrulanır.
    if (companyId) {
      if (!(await canAccessCompany(user.id, companyId, "canView"))) {
        return NextResponse.json({ error: "Şirket bulunamadı veya erişim yok" }, { status: 404 })
      }

      const fleets = await sql`
        SELECT * FROM fleets WHERE company_id = ${companyId} ORDER BY created_at DESC
      `
      return NextResponse.json({ fleets })
    }

    // Şirket belirtilmediyse kullanıcının eriştiği TÜM şirketlerin filoları
    // döner. Önceki kod LIMIT 1 ile rastgele tek şirket seçiyordu; birden
    // fazla şirketi olan kullanıcı diğer filolarını hiç göremiyordu.
    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ fleets: [] })
    }

    const fleets = await sql`
      SELECT * FROM fleets
      WHERE company_id = ANY(${allowedCompanyIds}::uuid[])
      ORDER BY created_at DESC
    `
    return NextResponse.json({ fleets })
  } catch (error) {
    return handleApiError(error, "Filo listesi")
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { company_id, name, description } = await request.json()

    if (!company_id || !name) {
      return NextResponse.json({ error: "Şirket ve filo adı zorunludur" }, { status: 400 })
    }

    // Filo eklemek bir yazma işlemidir: viewer yapamaz.
    if (!(await canAccessCompany(user.id, company_id, "canCreate"))) {
      return NextResponse.json({ error: "Şirket bulunamadı veya erişim yok" }, { status: 404 })
    }

    const newFleets = await sql`
      INSERT INTO fleets (company_id, name, description)
      VALUES (${company_id}, ${name}, ${description || null})
      RETURNING *
    `

    return NextResponse.json({ fleet: newFleets[0] }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Filo oluşturma")
  }
}
