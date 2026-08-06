import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { ForbiddenError, NotFoundError, canAccessCompany, type Permission } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { updateBankBalance } from "@/lib/update-bank-balance"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Kaydın kullanıcıya açık olduğunu doğrular.
 *
 * office_pnl.company_id boş olabilir; bu durumda kayıt yalnızca onu
 * oluşturan kullanıcıya aittir. Şirkete bağlıysa şirket yetkisi aranır.
 */
async function requireRecordAccess(userId: string, recordId: string, action: keyof Permission) {
  const [record] = await sql`
    SELECT company_id, created_by FROM office_pnl WHERE id = ${recordId}
  `

  if (!record) throw new NotFoundError("Kayıt bulunamadı")

  if (record.company_id) {
    if (!(await canAccessCompany(userId, record.company_id, action))) {
      throw new ForbiddenError()
    }
    return
  }

  if (record.created_by !== userId) {
    throw new ForbiddenError()
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Geçersiz kimlik biçimi" }, { status: 400 })
    }

    await requireRecordAccess(user.id, id, "canView")

    const result = await sql`
      SELECT
        op.*,
        fc.name as fee_code_name,
        pb.name as payee_bank_name,
        c.name as company_name_ref
      FROM office_pnl op
      LEFT JOIN office_fee_codes fc ON op.fee_code_id = fc.id
      LEFT JOIN office_payee_banks pb ON op.payee_bank_id = pb.id
      LEFT JOIN companies c ON op.company_id = c.id
      WHERE op.id = ${id}
    `

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Ofis P&L kaydı")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Geçersiz kimlik biçimi" }, { status: 400 })
    }

    await requireRecordAccess(user.id, id, "canEdit")

    const body = await request.json()
    const {
      feeCodeId, feeCodeCustom, companyId, companyName, payee, description,
      invoiceDate, invoiceNo, priceTl, priceUsd, currencyRate, paymentStatus,
      payeeBankId, payeeBankCustom, paymentDate, type, notes, reportMonth,
    } = body

    // Kayıt başka bir şirkete taşınıyorsa hedef şirkette de yetki aranır;
    // aksi halde kullanıcı kaydı erişemediği bir şirkete aktarabilirdi.
    if (companyId && !(await canAccessCompany(user.id, companyId, "canEdit"))) {
      throw new ForbiddenError()
    }

    let calculatedPriceUsd = priceUsd
    if (priceTl && currencyRate && !priceUsd) {
      calculatedPriceUsd = Number.parseFloat(priceTl) / Number.parseFloat(currencyRate)
    }

    const result = await sql`
      UPDATE office_pnl SET
        fee_code_id = ${feeCodeId || null},
        fee_code_custom = ${feeCodeCustom || null},
        company_id = ${companyId || null},
        company_name = ${companyName || null},
        payee = ${payee},
        description = ${description || null},
        invoice_date = ${invoiceDate || null},
        invoice_no = ${invoiceNo || null},
        price_tl = ${priceTl || null},
        price_usd = ${calculatedPriceUsd || null},
        currency_rate = ${currencyRate || null},
        payment_status = ${paymentStatus || "unpaid"},
        payee_bank_id = ${payeeBankId || null},
        payee_bank_custom = ${payeeBankCustom || null},
        payment_date = ${paymentDate || null},
        type = ${type || "expense"},
        notes = ${notes || null},
        report_month = ${reportMonth || null},
        updated_by = ${user.id},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 })
    }

    if (paymentStatus === "paid" && payeeBankId && reportMonth) {
      await updateBankBalance(id, user.id)
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return handleApiError(error, "Ofis P&L kaydı güncelleme")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Geçersiz kimlik biçimi" }, { status: 400 })
    }

    await requireRecordAccess(user.id, id, "canDelete")

    await sql`DELETE FROM office_pnl WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Ofis P&L kaydı silme")
  }
}
