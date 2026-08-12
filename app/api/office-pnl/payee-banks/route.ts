import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/** Ödeme yapılan bankalar tüm şirketlerce paylaşılan referans verisidir. */
export async function GET() {
  try {
    await requireAuth()

    const banks = await sql`
      SELECT * FROM office_payee_banks
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

    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Ad zorunludur" }, { status: 400 })
    }

    // Aynı ada sahip banka varsa yenisini oluşturmayıp mevcudu döneriz.
    // (office_payee_banks.name UNIQUE — 056 numaralı migration.)
    const result = await sql`
      INSERT INTO office_payee_banks (name, is_system)
      VALUES (${name.trim()}, false)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Ödeme bankası oluşturma")
  }
}
