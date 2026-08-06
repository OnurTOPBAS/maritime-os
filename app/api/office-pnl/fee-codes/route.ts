import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/** Ücret kodları tüm şirketlerce paylaşılan referans verisidir. */
export async function GET() {
  try {
    await requireAuth()

    const feeCodes = await sql`
      SELECT * FROM office_fee_codes
      ORDER BY is_system DESC, name ASC
    `

    return NextResponse.json(feeCodes)
  } catch (error) {
    return handleApiError(error, "Ücret kodları")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    // Paylaşılan referans verisini değiştirmek tüm şirketleri etkiler.
    await requireSystemAdmin(user.id)

    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Ad zorunludur" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO office_fee_codes (name, is_system)
      VALUES (${name.trim()}, false)
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, "Ücret kodu oluşturma")
  }
}
