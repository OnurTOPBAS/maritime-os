import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds, requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { updateBankBalance } from "@/lib/update-bank-balance"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const feeCodeId = searchParams.get("feeCodeId")
    const paymentStatus = searchParams.get("paymentStatus")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const reportMonth = searchParams.get("reportMonth")

    // Kullanıcının erişebildiği şirketler. Önceden bu sınır YOKTU: sorgu tüm
    // şirketlerin kâr/zarar kayıtlarını çekiyor, filtreleme yalnızca istemci
    // parametresi gönderirse JavaScript tarafında yapılıyordu. Yani parametre
    // göndermeyen bir kullanıcı bütün şirketlerin mali verisini görebiliyordu.
    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)

    if (allowedCompanyIds.length === 0) {
      return NextResponse.json([])
    }

    // "all" bir kimlik değil, "filtre yok" anlamına gelir; uuid'ye çevrilemez.
    const companyFilter = companyId && companyId !== "all" ? companyId : null
    const feeCodeFilter = feeCodeId && feeCodeId !== "all" ? feeCodeId : null
    const statusFilter = paymentStatus && paymentStatus !== "all" ? paymentStatus : null
    const typeFilter = type && type !== "all" ? type : null

    // Belirli bir şirket istendiyse ona erişimi olduğu doğrulanır.
    if (companyFilter) {
      await requireCompanyAccess(user.id, companyFilter, "canView")
    }

    // Filtreler SQL'e taşındı: hem güvenli hem de tüm tabloyu belleğe
    // çekmediği için çok daha verimli.
    const records = await sql`
      SELECT
        op.*,
        fc.name as fee_code_name,
        pb.name as payee_bank_name,
        c.name as company_name_ref
      FROM office_pnl op
      LEFT JOIN office_fee_codes fc ON op.fee_code_id = fc.id
      LEFT JOIN office_payee_banks pb ON op.payee_bank_id = pb.id
      LEFT JOIN companies c ON op.company_id = c.id
      WHERE (
              op.company_id = ANY(${allowedCompanyIds}::uuid[])
              -- Şirkete bağlanmamış kayıtlar yalnızca sahibine görünür.
              OR (op.company_id IS NULL AND op.created_by = ${user.id}::uuid)
            )
        AND (${companyFilter}::uuid IS NULL OR op.company_id = ${companyFilter}::uuid)
        AND (${feeCodeFilter}::uuid IS NULL OR op.fee_code_id = ${feeCodeFilter}::uuid)
        AND (${statusFilter}::text IS NULL OR op.payment_status = ${statusFilter}::text)
        AND (${typeFilter}::text IS NULL OR op.type = ${typeFilter}::text)
        AND (${reportMonth ?? null}::text IS NULL OR op.report_month = ${reportMonth ?? null}::text)
        AND (${startDate ?? null}::date IS NULL OR op.invoice_date >= ${startDate ?? null}::date)
        AND (${endDate ?? null}::date IS NULL OR op.invoice_date <= ${endDate ?? null}::date)
      ORDER BY op.invoice_date DESC, op.created_at DESC
    `

    return NextResponse.json(records)
  } catch (error) {
    return handleApiError(error, "Ofis P&L listesi")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 })
    }

    const {
      feeCodeId,
      feeCodeCustom,
      companyId,
      companyName,
      payee,
      description,
      invoiceDate,
      invoiceNo,
      priceTl,
      priceUsd,
      currencyRate,
      paymentStatus,
      payeeBankId,
      payeeBankCustom,
      paymentDate,
      type,
      notes,
      reportMonth,
    } = body

    if (!payee) {
      return NextResponse.json({ error: "Payee zorunludur" }, { status: 400 })
    }

    // Kayıt bir şirkete bağlanıyorsa o şirkette yazma yetkisi aranır.
    if (companyId) {
      await requireCompanyAccess(user.id, companyId, "canCreate")
    }

    let calculatedPriceUsd = priceUsd
    if (priceTl && currencyRate && !priceUsd) {
      calculatedPriceUsd = Number.parseFloat(priceTl) / Number.parseFloat(currencyRate)
    }

    const result = await sql`
      INSERT INTO office_pnl (
        fee_code_id, fee_code_custom, company_id, company_name, payee, description,
        invoice_date, invoice_no, price_tl, price_usd, currency_rate, payment_status,
        payee_bank_id, payee_bank_custom, payment_date, type, notes, report_month, created_by
      ) VALUES (
        ${feeCodeId || null}, ${feeCodeCustom || null}, ${companyId || null},
        ${companyName || null}, ${payee}, ${description || null},
        ${invoiceDate || null}, ${invoiceNo || null}, ${priceTl || null},
        ${calculatedPriceUsd || null}, ${currencyRate || null},
        ${paymentStatus || "unpaid"}, ${payeeBankId || null}, ${payeeBankCustom || null},
        ${paymentDate || null}, ${type || "expense"}, ${notes || null},
        ${reportMonth || null}, ${user.id}
      )
      RETURNING *
    `

    const newRecord = result[0]

    if (paymentStatus === "paid" && payeeBankId && reportMonth) {
      await updateBankBalance(newRecord.id, user.id)
    }

    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Ofis P&L kaydı oluşturma")
  }
}
