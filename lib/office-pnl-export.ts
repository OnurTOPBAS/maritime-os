import * as XLSX from "xlsx"

/*
 * Office PnL (Ofis Giderleri) verisini, ofisin kullandığı Excel şablonuna
 * birebir uygun biçimde dışa aktarır:
 *
 *  - Ana sayfa (ay adı): başlık + 12 kolon gider listesi + Toplam satırı,
 *    ardından "Actual Bank Accounts" banka bakiye tablosu + Total satırı.
 *  - Her fee code için ayrı bir "ayrıntı" sekmesi.
 */

const HEADERS = [
  "Fee Code",
  "Company",
  "Payee",
  "Description",
  "Invoice date",
  "Invoice No.",
  "Price TL",
  "Price USD",
  "Payment Status",
  "Payee Bank Account",
  "Payment Method",
  "Payment Date",
]

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const STATUS_LABEL: Record<string, string> = { paid: "Paid", unpaid: "Unpaid", cancel: "Cancel" }
const METHOD_LABEL: Record<string, string> = { bank: "Bank", cash: "Cash", kk: "KK" }
const DATE_TYPE_LABEL: Record<string, string> = { reel: "Reel", tahmini: "Tahmini", na: "N/A" }

function feeCodeName(r: any): string {
  return r.fee_code_name || r.fee_code_custom || "—"
}
function bankName(r: any): string {
  return r.payee_bank_name || r.payee_bank_custom || ""
}
function fmtDate(d: any): string {
  if (!d) return ""
  const date = new Date(d)
  if (isNaN(date.getTime())) return ""
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${dd}.${mm}.${date.getFullYear()}`
}
/** Invoice date hücresi: gerçek tarih varsa tarih, yoksa tarih tipi etiketi. */
function invoiceDateCell(r: any): string {
  const d = fmtDate(r.invoice_date)
  if (d) return d
  return DATE_TYPE_LABEL[r.date_type] || ""
}
/** Payment date hücresi: tarih varsa tarih, yoksa N/A. */
function paymentDateCell(r: any): string {
  const d = fmtDate(r.payment_date)
  return d || "N/A"
}
function num(v: any): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

/** Bir gider kaydını 12 kolonluk satıra çevirir. */
function recordToRow(r: any): (string | number)[] {
  return [
    feeCodeName(r),
    r.company_name || r.company_name_ref || "",
    r.payee || "",
    r.description || "",
    invoiceDateCell(r),
    r.invoice_no || "",
    num(r.price_tl),
    num(r.price_usd),
    STATUS_LABEL[r.payment_status] || r.payment_status || "",
    bankName(r),
    METHOD_LABEL[r.payment_method] || "",
    paymentDateCell(r),
  ]
}

/** Excel sekme adı kısıtlarına uydurur (≤31 karakter, yasak karakter yok). */
function safeSheetName(name: string, used: Set<string>): string {
  let base = (name || "Ayrıntı").replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 28) || "Ayrıntı"
  let candidate = base
  let i = 2
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 28)} ${i}`
    i++
  }
  used.add(candidate.toLowerCase())
  return candidate
}

/** Para kolonlarına (Price TL / Price USD) binlik ayraçlı biçim uygular. */
function applyMoneyFormat(ws: XLSX.WorkSheet, colIndices: number[], firstDataRow: number, lastRow: number) {
  for (let r = firstDataRow; r <= lastRow; r++) {
    for (const c of colIndices) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      if (cell && typeof cell.v === "number") cell.z = "#,##0.00"
    }
  }
}

export interface OfficePnlBalance {
  bank_name?: string
  closing_balance_tl?: number
  closing_balance_usd?: number
  closing_balance_aed?: number
  balance_tl?: number
  balance_usd?: number
}

export function exportOfficePnlToExcel(
  records: any[],
  balances: OfficePnlBalance[],
  reportMonth: string, // "YYYY-MM"
) {
  const [yearStr, monthStr] = (reportMonth || "").split("-")
  const year = Number(yearStr) || new Date().getFullYear()
  const monthIdx = (Number(monthStr) || 1) - 1
  const monthTr = MONTHS_TR[monthIdx] ?? ""
  const monthEn = MONTHS_EN[monthIdx] ?? ""

  // Fee code'a göre sırala (gruplu görünsün).
  const sorted = [...records].sort((a, b) =>
    feeCodeName(a).localeCompare(feeCodeName(b), "tr"),
  )

  const wb = XLSX.utils.book_new()

  /* ---------- Ana sayfa ---------- */
  const title = `${monthEn} ${year} - Office Expenses`
  const dataRows = sorted.map(recordToRow)
  const totalTl = sorted.reduce((s, r) => s + num(r.price_tl), 0)
  const totalUsd = sorted.reduce((s, r) => s + num(r.price_usd), 0)
  const totalRow: (string | number)[] = ["Toplam", "", "", "", "", "", totalTl, totalUsd, "", "", "", ""]

  const aoa: (string | number)[][] = [[title], HEADERS, ...dataRows, totalRow, []]

  // Banka bakiye tablosu
  const bankHeaderRowIdx = aoa.length
  aoa.push(["Actual Bank Accounts"])
  aoa.push(["Bank / Kasa", "Balance TL", "Balance USD", "Balance AED"])
  let sumTl = 0, sumUsd = 0, sumAed = 0
  for (const b of balances) {
    const tl = num(b.closing_balance_tl ?? b.balance_tl)
    const usd = num(b.closing_balance_usd ?? b.balance_usd)
    const aed = num(b.closing_balance_aed)
    sumTl += tl; sumUsd += usd; sumAed += aed
    aoa.push([b.bank_name || "", tl, usd, aed])
  }
  aoa.push(["Total:", sumTl, sumUsd, sumAed])

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws["!merges"] = [{ s: { c: 0, r: 0 }, e: { c: 11, r: 0 } }]
  ws["!cols"] = [
    { wch: 28 }, { wch: 18 }, { wch: 22 }, { wch: 40 }, { wch: 12 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
  ]
  // Para biçimi: gider satırları (Price TL=6, Price USD=7) + toplam satırı.
  applyMoneyFormat(ws, [6, 7], 2, 2 + dataRows.length) // dahil toplam satırı
  // Banka tablosu para kolonları (1,2,3), başlık+total dahil veri satırları.
  applyMoneyFormat(ws, [1, 2, 3], bankHeaderRowIdx + 2, bankHeaderRowIdx + 2 + balances.length)

  const mainSheetName = safeSheetName(`${monthTr} ${year}`, new Set())
  XLSX.utils.book_append_sheet(wb, ws, mainSheetName)

  /* ---------- Fee code ayrıntı sekmeleri ---------- */
  const groups = new Map<string, any[]>()
  for (const r of sorted) {
    const key = feeCodeName(r)
    ;(groups.get(key) ?? groups.set(key, []).get(key)!).push(r)
  }

  const usedNames = new Set<string>([mainSheetName.toLowerCase()])
  for (const [name, rows] of groups) {
    const dRows = rows.map(recordToRow)
    const gTl = rows.reduce((s, r) => s + num(r.price_tl), 0)
    const gUsd = rows.reduce((s, r) => s + num(r.price_usd), 0)
    const detailAoa: (string | number)[][] = [
      [`Toplam Price TL - Fee Code: ${name} için ayrıntılar`],
      HEADERS,
      ...dRows,
      ["Toplam", "", "", "", "", "", gTl, gUsd, "", "", "", ""],
    ]
    const dws = XLSX.utils.aoa_to_sheet(detailAoa)
    dws["!merges"] = [{ s: { c: 0, r: 0 }, e: { c: 11, r: 0 } }]
    dws["!cols"] = ws["!cols"]
    applyMoneyFormat(dws, [6, 7], 2, 2 + dRows.length)
    XLSX.utils.book_append_sheet(wb, dws, safeSheetName(name, usedNames))
  }

  const fileName = `Ofis-Giderleri-${monthTr}-${year}.xlsx`
  XLSX.writeFile(wb, fileName)
}
