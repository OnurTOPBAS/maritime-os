import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireResourceAccess, resolveBankAccountCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveBankAccountCompany, id, "finance", "edit", "Hesap bulunamadı")

    const result = await sql`
      UPDATE bank_accounts
      SET 
        account_name = ${body.accountName},
        account_number = ${body.accountNumber},
        currency = ${body.currency || "USD"},
        iban = ${body.iban || null},
        account_type = ${body.accountType || null},
        is_active = ${body.isActive !== false},
        notes = ${body.notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update account error:", error)
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions
    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.
    await requireResourceAccess(user.id, resolveBankAccountCompany, id, "finance", "delete", "Hesap bulunamadı")

    await sql`DELETE FROM bank_accounts WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete account error:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
