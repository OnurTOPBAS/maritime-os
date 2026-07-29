import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/session"
import { updateBankBalance } from "@/lib/update-bank-balance"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const feeCodeId = searchParams.get("feeCodeId")
    const paymentStatus = searchParams.get("paymentStatus")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const reportMonth = searchParams.get("reportMonth")

    // Fetch all records using tagged template literal
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
      ORDER BY op.invoice_date DESC, op.created_at DESC
    `

    // Apply filters in JavaScript
    let filteredRecords = records

    // Filter by report month (format: YYYY-MM)
    if (reportMonth) {
      filteredRecords = filteredRecords.filter((r: any) => r.report_month === reportMonth)
    }

    if (companyId && companyId !== "all") {
      filteredRecords = filteredRecords.filter((r: any) => r.company_id === companyId)
    }

    if (feeCodeId && feeCodeId !== "all") {
      filteredRecords = filteredRecords.filter((r: any) => r.fee_code_id === feeCodeId)
    }

    if (paymentStatus && paymentStatus !== "all") {
      filteredRecords = filteredRecords.filter((r: any) => r.payment_status === paymentStatus)
    }

    if (type && type !== "all") {
      filteredRecords = filteredRecords.filter((r: any) => r.type === type)
    }

    if (startDate) {
      const start = new Date(startDate)
      filteredRecords = filteredRecords.filter((r: any) => {
        if (!r.invoice_date) return false
        return new Date(r.invoice_date) >= start
      })
    }

    if (endDate) {
      const end = new Date(endDate)
      filteredRecords = filteredRecords.filter((r: any) => {
        if (!r.invoice_date) return false
        return new Date(r.invoice_date) <= end
      })
    }

    return NextResponse.json(filteredRecords)
  } catch (error: any) {
    console.error("Error fetching office PnL records:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
      body = await request.json()
    } catch (parseError: any) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
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

    // Hesaplama: Eğer TL girilmişse ve kur varsa USD'yi hesapla
    let calculatedPriceUsd = priceUsd
    if (priceTl && currencyRate && !priceUsd) {
      calculatedPriceUsd = parseFloat(priceTl) / parseFloat(currencyRate)
    }

    const result = await sql`
      INSERT INTO office_pnl (
        fee_code_id,
        fee_code_custom,
        company_id,
        company_name,
        payee,
        description,
        invoice_date,
        invoice_no,
        price_tl,
        price_usd,
        currency_rate,
        payment_status,
        payee_bank_id,
        payee_bank_custom,
        payment_date,
        type,
        notes,
        report_month,
        created_by
      ) VALUES (
        ${feeCodeId || null},
        ${feeCodeCustom || null},
        ${companyId || null},
        ${companyName || null},
        ${payee},
        ${description || null},
        ${invoiceDate || null},
        ${invoiceNo || null},
        ${priceTl || null},
        ${calculatedPriceUsd || null},
        ${currencyRate || null},
        ${paymentStatus || "unpaid"},
        ${payeeBankId || null},
        ${payeeBankCustom || null},
        ${paymentDate || null},
        ${type || "expense"},
        ${notes || null},
        ${reportMonth || null},
        ${session.id}
      )
      RETURNING *
    `

    const newRecord = result[0]

    // Update bank balance if payment is made
    if (paymentStatus === "paid" && payeeBankId && reportMonth) {
      await updateBankBalance(newRecord.id, session.id)
    }

    return NextResponse.json(newRecord, { status: 201 })
  } catch (error: any) {
    console.error("Error creating office PnL record:", error)
    return NextResponse.json({ error: error.message || "Database error" }, { status: 500 })
  }
}
