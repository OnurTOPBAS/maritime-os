import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

/*
 * Şablon formatındaki (bizim export ettiğimiz) Office PnL satırlarını içe
 * aktarır. İstemci ana sayfadaki 12 kolonu ayrıştırıp buraya gönderir; burada
 * fee code / banka eşleştirmesi, enum ve tarih dönüşümü yapılıp kayıt eklenir.
 */

const STATUS_MAP: Record<string, string> = {
  paid: "paid", ödendi: "paid",
  unpaid: "unpaid", ödenmedi: "unpaid", ödenmemiş: "unpaid",
  cancel: "cancel", cancelled: "cancel", iptal: "cancel",
}
const METHOD_MAP: Record<string, string> = {
  bank: "bank", banka: "bank",
  cash: "cash", nakit: "cash",
  kk: "kk", "kredi kartı": "kk", "credit card": "kk",
}
const DATE_TYPE_MAP: Record<string, string> = {
  reel: "reel", real: "reel",
  tahmini: "tahmini", estimated: "tahmini",
  "n/a": "na", na: "na",
}

/** "10.000,00" / "10,000.00" / "1 234.56" gibi metinleri sayıya çevirir. */
function parseNumber(v: any): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return isNaN(v) ? null : v
  let s = String(v).trim().replace(/[₺$€\s]/g, "")
  if (!s) return null
  const neg = /^\(.*\)$/.test(s)
  s = s.replace(/[()]/g, "")
  // Hem "1.234,56" hem "1,234.56" biçimlerini destekle:
  if (s.includes(",") && s.includes(".")) {
    // son ayraç ondalıktır
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".")
    else s = s.replace(/,/g, "")
  } else if (s.includes(",")) {
    // yalnız virgül: ondalık ayraç kabul et
    s = s.replace(/\./g, "").replace(",", ".")
  }
  const n = Number(s)
  if (isNaN(n)) return null
  return neg ? -n : n
}

/** "13.08.2026", "8/3/26", ISO veya Excel tarih metnini YYYY-MM-DD'ye çevirir. */
function parseDate(v: any): string | null {
  if (v == null || v === "") return null
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10)
  const s = String(v).trim()
  if (!s) return null
  // DD.MM.YYYY
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (m) {
    const [_, d, mo, y] = m
    const year = y.length === 2 ? 2000 + Number(y) : Number(y)
    return `${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }
  // M/D/YY veya M/D/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    const [_, mo, d, y] = m
    const year = y.length === 2 ? 2000 + Number(y) : Number(y)
    return `${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }
  // ISO
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return null
}

function norm(v: any): string {
  return String(v ?? "").trim().toLowerCase()
}

async function resolveFeeCodeId(name: string): Promise<string | null> {
  if (!name) return null
  const found = await sql`SELECT id FROM office_fee_codes WHERE lower(name) = ${name.toLowerCase()} LIMIT 1`
  if (found.length > 0) return found[0].id
  // Yoksa oluştur (filtrede görünsün); ad benzersiz (056).
  const created = await sql`
    INSERT INTO office_fee_codes (name, is_system) VALUES (${name}, false)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `
  return created[0]?.id ?? null
}

async function resolveBank(name: string): Promise<{ id: string | null; custom: string | null }> {
  if (!name) return { id: null, custom: null }
  const found = await sql`SELECT id FROM office_payee_banks WHERE lower(name) = ${name.toLowerCase()} LIMIT 1`
  if (found.length > 0) return { id: found[0].id, custom: null }
  return { id: null, custom: name } // eşleşmezse serbest metin olarak sakla
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { reportMonth, rows } = body

    if (!reportMonth || typeof reportMonth !== "string") {
      return NextResponse.json({ error: "reportMonth zorunludur" }, { status: 400 })
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "İçe aktarılacak satır yok" }, { status: 400 })
    }

    let inserted = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const payee = String(r.payee ?? "").trim()
      if (!payee) {
        errors.push(`Satır ${i + 1}: Payee boş, atlandı`)
        continue
      }

      try {
        const feeCodeId = await resolveFeeCodeId(String(r.feeCode ?? "").trim())
        const bank = await resolveBank(String(r.bank ?? "").trim())

        const statusKey = norm(r.paymentStatus)
        const payment_status = STATUS_MAP[statusKey] ?? "unpaid"
        const methodKey = norm(r.paymentMethod)
        const payment_method = METHOD_MAP[methodKey] ?? null

        // Invoice date: tarih mi yoksa Reel/Tahmini/N/A işareti mi?
        const invRaw = r.invoiceDate
        const invDate = parseDate(invRaw)
        const dateTypeKey = norm(invRaw)
        const date_type = invDate ? null : (DATE_TYPE_MAP[dateTypeKey] ?? null)

        const payDate = parseDate(r.paymentDate)

        await sql`
          INSERT INTO office_pnl (
            fee_code_id, fee_code_custom, company_id, company_name, payee, description,
            invoice_date, invoice_no, price_tl, price_usd, payment_status,
            payee_bank_id, payee_bank_custom, payment_method, date_type, payment_date,
            type, report_month, created_by
          ) VALUES (
            ${feeCodeId}, ${feeCodeId ? null : (String(r.feeCode ?? "").trim() || null)}, ${null},
            ${String(r.company ?? "").trim() || null}, ${payee}, ${String(r.description ?? "").trim() || null},
            ${invDate}, ${String(r.invoiceNo ?? "").trim() || null},
            ${parseNumber(r.priceTl)}, ${parseNumber(r.priceUsd)}, ${payment_status},
            ${bank.id}, ${bank.custom}, ${payment_method}, ${date_type}, ${payDate},
            ${"expense"}, ${reportMonth}, ${user.id}
          )
        `
        inserted++
      } catch (e: any) {
        errors.push(`Satır ${i + 1}: ${e?.message ?? "hata"}`)
      }
    }

    return NextResponse.json({ inserted, total: rows.length, errors })
  } catch (error) {
    return handleApiError(error, "Office PnL içe aktarma")
  }
}
