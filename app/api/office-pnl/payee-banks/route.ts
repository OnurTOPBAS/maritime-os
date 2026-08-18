import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin, getAccessibleCompanyIds, isSuperAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Ödeme yapılan bankalar/kasalar. Şirket izolasyonu: kullanıcı yalnızca
 * erişebildiği şirketlerin hesaplarını görür; süper yönetici hepsini.
 */
export async function GET() {
  try {
    const user = await requireAuth()
    const superAdmin = await isSuperAdmin(user.id)
    const allowed = await getAccessibleCompanyIds(user.id)

    const banks = superAdmin
      ? await sql`SELECT * FROM office_payee_banks ORDER BY is_system DESC, name ASC`
      : allowed.length === 0
        ? []
        : await sql`
            SELECT * FROM office_payee_banks
            WHERE company_id = ANY(${allowed}::uuid[])
            ORDER BY is_system DESC, name ASC
          `

    return NextResponse.json(banks)
  } catch (error) {
    return handleApiError(error, "Ödeme bankaları")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    await requireSystemAdmin(user.id)

    const { name, companyId, bankType } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Ad zorunludur" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO office_payee_banks (name, is_system, company_id, bank_type)
      VALUES (${name.trim()}, false, ${companyId || null}, ${bankType || "other"})
      ON CONFLICT (name) DO UPDATE SET
        company_id = COALESCE(EXCLUDED.company_id, office_payee_banks.company_id),
        bank_type = COALESCE(EXCLUDED.bank_type, office_payee_banks.bank_type)
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Ödeme bankası oluşturma")
  }
}
