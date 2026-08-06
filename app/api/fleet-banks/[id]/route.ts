import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireResourceAccess, resolveFleetBankCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveFleetBankCompany, id, "finance", "view", "Banka bulunamadı")

    const banks = await sql`SELECT * FROM fleet_banks WHERE id = ${id}`
    if (banks.length === 0) {
      return NextResponse.json({ error: "Banka bulunamadı" }, { status: 404 })
    }

    // Get accounts for this bank
    const accounts = await sql`
      SELECT * FROM bank_accounts
      WHERE bank_id = ${id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ ...banks[0], accounts })
  } catch (error) {
    return handleApiError(error, "Banka getirme")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveFleetBankCompany, id, "finance", "edit", "Banka bulunamadı")

    const result = await sql`
      UPDATE fleet_banks
      SET 
        bank_name = ${body.bankName},
        bank_code = ${body.bankCode || null},
        swift_code = ${body.swiftCode || null},
        branch_name = ${body.branchName || null},
        branch_address = ${body.branchAddress || null},
        relationship_manager_name = ${body.relationshipManagerName || null},
        relationship_manager_email = ${body.relationshipManagerEmail || null},
        relationship_manager_phone = ${body.relationshipManagerPhone || null},
        notes = ${body.notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update bank error:", error)
    return NextResponse.json({ error: "Failed to update bank" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveFleetBankCompany, id, "finance", "delete", "Banka bulunamadı")

    await sql`DELETE FROM fleet_banks WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete bank error:", error)
    return NextResponse.json({ error: "Failed to delete bank" }, { status: 500 })
  }
}
