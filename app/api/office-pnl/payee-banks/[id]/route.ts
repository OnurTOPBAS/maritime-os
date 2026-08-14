import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Banka / kasa adını değiştirir. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await requireSystemAdmin(user.id)
    const { id } = await params
    if (!UUID.test(id)) return NextResponse.json({ error: "Geçersiz kimlik" }, { status: 400 })

    const { name } = await request.json()
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Ad zorunludur" }, { status: 400 })
    }

    // Aynı ada sahip başka bir kayıt var mı? (name benzersiz)
    const clash = await sql`
      SELECT 1 FROM office_payee_banks WHERE lower(name) = ${name.trim().toLowerCase()} AND id <> ${id}
    `
    if (clash.length > 0) {
      return NextResponse.json({ error: "Bu isimde bir banka/kasa zaten var" }, { status: 409 })
    }

    const result = await sql`
      UPDATE office_payee_banks SET name = ${name.trim()} WHERE id = ${id} RETURNING *
    `
    if (result.length === 0) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Banka/kasa güncelleme")
  }
}

/** Banka / kasa siler. Kullanımdaysa (kayıt veya bakiye) engellenir. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    await requireSystemAdmin(user.id)
    const { id } = await params
    if (!UUID.test(id)) return NextResponse.json({ error: "Geçersiz kimlik" }, { status: 400 })

    const [used] = await sql`
      SELECT
        (SELECT COUNT(*) FROM office_pnl WHERE payee_bank_id = ${id}) AS records,
        (SELECT COUNT(*) FROM office_bank_balances WHERE bank_id = ${id}) AS balances
    `
    const records = Number(used.records) || 0
    const balances = Number(used.balances) || 0
    if (records > 0 || balances > 0) {
      return NextResponse.json(
        {
          error: `Bu banka/kasa kullanımda (${records} kayıt, ${balances} bakiye). Önce onları başka bir hesaba taşıyın veya silin.`,
        },
        { status: 409 },
      )
    }

    const result = await sql`DELETE FROM office_payee_banks WHERE id = ${id} RETURNING id`
    if (result.length === 0) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Banka/kasa silme")
  }
}
