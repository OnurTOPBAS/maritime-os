import ExcelJS from "exceljs"

/*
 * Office PnL (Ofis Giderleri) verisini, ofisin kullandığı Excel şablonunun
 * GÖRÜNÜMÜNE birebir uyacak biçimde dışa aktarır (renkler, başlık biçimleri,
 * çerçeveler, muhasebe sayı biçimi dahil). ExcelJS kullanır çünkü stil basar.
 *
 *  - Ana sayfa (ay adı): koyu mavi başlık şeridi + açık mavi başlık satırı +
 *    12 kolon gider listesi (çerçeveli) + yeşil Toplam satırı, ardından
 *    "Actual Bank Accounts" banka tablosu (TL/USD/AED) + Total.
 *  - Her fee code için ayrı ayrıntı sekmesi.
 */

const HEADERS = [
  "Fee Code", "Company", "Payee", "Description", "Invoice date", "Invoice No.",
  "Price TL", "Price USD", "Payment Status", "Payee Bank Account", "Payment Method", "Payment Date",
]

const COL_WIDTHS = [26, 12.5, 15.5, 50, 13.6, 12, 17.25, 16.5, 14.75, 13.4, 12.25, 10.1]

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const STATUS_LABEL: Record<string, string> = { paid: "Paid", unpaid: "Unpaid", cancel: "Cancel" }
const METHOD_LABEL: Record<string, string> = { bank: "Bank", cash: "Cash", kk: "KK" }
const DATE_TYPE_LABEL: Record<string, string> = { reel: "Reel", tahmini: "Tahmini", na: "N/A" }

// Şablondan çıkarılan renkler ve muhasebe biçimi.
const COLOR_TITLE = "FF002060" // koyu mavi başlık şeridi
const COLOR_HEADER = "FF61CBF4" // açık mavi başlık satırı
const COLOR_TOTAL = "FF4EA72E" // yeşil toplam satırı
const MONEY_FMT = '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)'
const THIN = { style: "thin" as const, color: { argb: "FF000000" } }
const ALL_BORDERS = { top: THIN, left: THIN, bottom: THIN, right: THIN }

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
function invoiceDateCell(r: any): string {
  return fmtDate(r.invoice_date) || DATE_TYPE_LABEL[r.date_type] || ""
}
function paymentDateCell(r: any): string {
  return fmtDate(r.payment_date) || "N/A"
}
function num(v: any): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}
function recordToRow(r: any): (string | number)[] {
  return [
    feeCodeName(r), r.company_name || r.company_name_ref || "", r.payee || "", r.description || "",
    invoiceDateCell(r), r.invoice_no || "", num(r.price_tl), num(r.price_usd),
    STATUS_LABEL[r.payment_status] || r.payment_status || "", bankName(r),
    METHOD_LABEL[r.payment_method] || "", paymentDateCell(r),
  ]
}
function safeSheetName(name: string, used: Set<string>): string {
  const base = (name || "Ayrıntı").replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 28) || "Ayrıntı"
  let candidate = base
  let i = 2
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 26)} ${i}`
    i++
  }
  used.add(candidate.toLowerCase())
  return candidate
}

/** 12 kolonluk gider tablosunu (başlık + veri + toplam) bir sayfaya yazar. */
function writeExpenseTable(ws: ExcelJS.Worksheet, headerRowNum: number, rows: any[]) {
  // Başlık satırı (açık mavi, kalın, çerçeveli)
  const header = ws.getRow(headerRowNum)
  HEADERS.forEach((h, i) => {
    const cell = header.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, size: 11, name: "Arial" }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER } }
    cell.border = ALL_BORDERS
    cell.alignment = { horizontal: "center", vertical: "middle" }
  })

  // Veri satırları
  let rowNum = headerRowNum + 1
  for (const r of rows) {
    const values = recordToRow(r)
    const row = ws.getRow(rowNum)
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v as any
      cell.font = { size: 10, name: "Aptos Narrow" }
      cell.border = ALL_BORDERS
      if (i === 6 || i === 7) {
        cell.numFmt = MONEY_FMT
        cell.alignment = { horizontal: "right" }
      }
    })
    rowNum++
  }

  // Toplam satırı (yeşil, kalın)
  const totalTl = rows.reduce((s, r) => s + num(r.price_tl), 0)
  const totalUsd = rows.reduce((s, r) => s + num(r.price_usd), 0)
  const totalRow = ws.getRow(rowNum)
  const totalValues = ["Toplam", "", "", "", "", "", totalTl, totalUsd, "", "", "", ""]
  totalValues.forEach((v, i) => {
    const cell = totalRow.getCell(i + 1)
    cell.value = v as any
    cell.font = { bold: true, size: 12 }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TOTAL } }
    cell.border = ALL_BORDERS
    if (i === 6 || i === 7) {
      cell.numFmt = MONEY_FMT
      cell.alignment = { horizontal: "right" }
    }
  })
  return rowNum // son yazılan satır (toplam)
}

export async function exportOfficePnlToExcel(
  records: any[],
  balances: any[],
  reportMonth: string, // "YYYY-MM"
) {
  const [yearStr, monthStr] = (reportMonth || "").split("-")
  const year = Number(yearStr) || new Date().getFullYear()
  const monthIdx = (Number(monthStr) || 1) - 1
  const monthTr = MONTHS_TR[monthIdx] ?? ""
  const monthEn = MONTHS_EN[monthIdx] ?? ""

  const sorted = [...records].sort((a, b) => feeCodeName(a).localeCompare(feeCodeName(b), "tr"))

  const wb = new ExcelJS.Workbook()
  const usedNames = new Set<string>()

  /* ---------- Ana sayfa ---------- */
  const main = wb.addWorksheet(safeSheetName(`${monthTr} ${year}`, usedNames))
  main.columns = COL_WIDTHS.map((w) => ({ width: w }))

  // Başlık şeridi (koyu mavi, beyaz, ortalı, A1:L1 birleşik)
  main.mergeCells(1, 1, 1, 12)
  const titleCell = main.getCell("A1")
  titleCell.value = `${monthEn} ${year} - Office Expenses`
  titleCell.font = { bold: true, size: 20, color: { argb: "FFFFFFFF" }, name: "Aptos" }
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TITLE } }
  titleCell.alignment = { horizontal: "center", vertical: "middle" }
  main.getRow(1).height = 28

  const lastExpenseRow = writeExpenseTable(main, 2, sorted)

  // Başlık satırına filtre (Excel'de kolon açılır filtreleri). Toplam satırı
  // hariç, başlık + veri aralığını kapsar.
  main.autoFilter = { from: { row: 2, column: 1 }, to: { row: Math.max(2, lastExpenseRow - 1), column: 12 } }

  /* ---------- Banka bakiye tablosu ---------- */
  const bankTitleRow = lastExpenseRow + 2
  main.mergeCells(bankTitleRow, 1, bankTitleRow, 4)
  const bankTitle = main.getCell(bankTitleRow, 1)
  bankTitle.value = "Actual Bank Accounts"
  bankTitle.font = { bold: true, size: 12 }
  bankTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER } }
  bankTitle.alignment = { horizontal: "center", vertical: "middle" }

  const bankHeaderRow = bankTitleRow + 1
  const bankHeaders = ["Bank / Kasa", "Balance TL", "Balance USD", "Balance AED"]
  bankHeaders.forEach((h, i) => {
    const cell = main.getCell(bankHeaderRow, i + 1)
    cell.value = h
    cell.font = { bold: true, size: 11 }
    cell.border = ALL_BORDERS
    cell.alignment = { horizontal: "center" }
  })

  let br = bankHeaderRow + 1
  let sumTl = 0, sumUsd = 0, sumAed = 0
  for (const b of balances) {
    const tl = num(b.closing_balance_tl ?? b.balance_tl)
    const usd = num(b.closing_balance_usd ?? b.balance_usd)
    const aed = num(b.closing_balance_aed)
    sumTl += tl; sumUsd += usd; sumAed += aed
    const vals = [b.bank_name || "", tl, usd, aed]
    vals.forEach((v, i) => {
      const cell = main.getCell(br, i + 1)
      cell.value = v as any
      cell.font = { size: 10, name: "Aptos Narrow" }
      cell.border = ALL_BORDERS
      if (i >= 1) { cell.numFmt = MONEY_FMT; cell.alignment = { horizontal: "right" } }
    })
    br++
  }
  const totVals = ["Total:", sumTl, sumUsd, sumAed]
  totVals.forEach((v, i) => {
    const cell = main.getCell(br, i + 1)
    cell.value = v as any
    cell.font = { bold: true, size: 11 }
    cell.border = ALL_BORDERS
    if (i >= 1) { cell.numFmt = MONEY_FMT; cell.alignment = { horizontal: "right" } }
  })

  /* ---------- Fee code ayrıntı sekmeleri ---------- */
  const groups = new Map<string, any[]>()
  for (const r of sorted) {
    const key = feeCodeName(r)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  for (const [name, rows] of groups) {
    const ws = wb.addWorksheet(safeSheetName(name, usedNames))
    ws.columns = COL_WIDTHS.map((w) => ({ width: w }))
    ws.mergeCells(1, 1, 1, 12)
    const t = ws.getCell("A1")
    t.value = `Toplam Price TL - Fee Code: ${name} için ayrıntılar`
    t.font = { bold: true, size: 12 }
    t.alignment = { vertical: "middle" }
    const detailTotal = writeExpenseTable(ws, 2, rows)
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: Math.max(2, detailTotal - 1), column: 12 } }
  }

  /* ---------- İndir ---------- */
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `Ofis-Giderleri-${monthTr}-${year}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
