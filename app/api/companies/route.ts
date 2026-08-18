import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds, requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET() {
  try {
    const user = await requireAuth()

    // Erişilebilir şirketler (süper yönetici -> tümü). Hem user_permissions
    // hem company_team_members üyeliklerini kapsar; tek bir yerden çözülür.
    const ids = await getAccessibleCompanyIds(user.id)
    if (ids.length === 0) return NextResponse.json([])

    const companies = await sql`
      SELECT c.* FROM companies c
      WHERE c.id = ANY(${ids})
      ORDER BY c.created_at DESC
    `
    return NextResponse.json(companies)
  } catch (error) {
    return handleApiError(error, "Şirketler")
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    // SABİT KURAL: Şirket oluşturma yalnızca süper yönetici veya admin/owner
    // içindir; hangi modül izni verilirse verilsin başka rol şirket oluşturamaz.
    await requireSystemAdmin(user.id)

    const { name, address, phone, email, tax_number } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Şirket adı gerekli" }, { status: 400 })
    }

    const newCompanies = await sql`
      INSERT INTO companies (name, owner_id, address, phone, email, tax_number)
      VALUES (${name}, ${user.id}, ${address || null}, ${phone || null}, ${email || null}, ${tax_number || null})
      RETURNING *
    `

    return NextResponse.json(newCompanies[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Şirket oluşturma")
  }
}
