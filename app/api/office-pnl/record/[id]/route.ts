import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/session"
import { updateBankBalance } from "@/lib/update-bank-balance"

const sql = neon(process.env.DATABASE_URL!)

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

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

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error fetching office PnL record:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }
    const body = await request.json()
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

    // Hesaplama: Eğer TL girilmişse ve kur varsa USD'yi hesapla
    let calculatedPriceUsd = priceUsd
    if (priceTl && currencyRate && !priceUsd) {
      calculatedPriceUsd = parseFloat(priceTl) / parseFloat(currencyRate)
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
        updated_by = ${session.id},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    const updatedRecord = result[0]

    // Update bank balance if payment is made
    if (paymentStatus === "paid" && payeeBankId && reportMonth) {
      await updateBankBalance(id, session.id)
    }

    return NextResponse.json(updatedRecord)
  } catch (error: any) {
    console.error("Error updating office PnL record:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    await sql`DELETE FROM office_pnl WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting office PnL record:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
