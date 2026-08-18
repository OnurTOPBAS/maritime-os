import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import {
  getAccessibleCompanyIds,
  requireCompanyAccess,
  requireCompanyOwner,
} from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Erişim: süper yönetici tümü, diğerleri yalnızca üye/sahibi olduğu şirket.
    const accessible = await getAccessibleCompanyIds(user.id)
    if (!accessible.includes(id)) {
      return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 })
    }

    const companies = await sql`SELECT * FROM companies WHERE id = ${id}`
    if (companies.length === 0) {
      return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ company: companies[0] })
  } catch (error) {
    return handleApiError(error, "Şirket detayı")
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Düzenleme companies.edit iznine sahip roller içindir (süper yönetici geçer).
    await requireCompanyAccess(user.id, id, "canEdit", "companies")

    const { name, address, phone, email, tax_number } = await request.json()

    const updatedCompanies = await sql`
      UPDATE companies
      SET
        name = ${name},
        address = ${address || null},
        phone = ${phone || null},
        email = ${email || null},
        tax_number = ${tax_number || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (updatedCompanies.length === 0) {
      return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ company: updatedCompanies[0] })
  } catch (error) {
    return handleApiError(error, "Şirket güncelleme")
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // SABİT KURAL: Şirketi yalnızca sahibi (admin) veya süper yönetici silebilir.
    await requireCompanyOwner(user.id, id)

    const deletedCompanies = await sql`
      DELETE FROM companies WHERE id = ${id} RETURNING id
    `

    if (deletedCompanies.length === 0) {
      return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Şirket silme")
  }
}
