import * as XLSX from "xlsx"

export interface InvoiceExcelRow {
  "Fatura No": string
  "Fatura Tarihi": string
  "Vade Tarihi": string
  "Fatura Türü": "Navlun" | "AWRP" | "Demuraj" | "Diğer"
  Tip: "Gelir" | "Gider"
  "Gemi Adı": string
  Kiracı: string
  Tutar: number
  "Para Birimi": string
  Durum: "Beklemede" | "Ödendi" | "Vadesi Geçti" | "İptal"
  "Komisyon Oranı (%)": number
  "Komisyon Tutarı": number
  "Komisyon Durumu": "Beklemede" | "Tahsil Edildi" | "Gecikmiş"
  Açıklama: string
  Notlar: string
}

/*
 * Çeviri tabloları iki yönlüdür ve yön başına ayrı tanımlanır.
 * Önceden tek nesnede birleşiktiler; bu, TypeScript'in değer tipini iki dilin
 * birleşimi olarak çıkarmasına ve dışa aktarım satır tipiyle uyuşmamasına
 * yol açıyordu. Ayrıca hangi yönün kullanıldığı okurken belirsizdi.
 */

/** Excel (Türkçe) -> veritabanı (İngilizce). İçe aktarımda kullanılır. */
const invoiceTypeToDb = {
  Navlun: "freight",
  AWRP: "awrp",
  Demuraj: "demurrage",
  Diğer: "other",
} as const

/** Veritabanı -> Excel. Dışa aktarımda kullanılır. */
const invoiceTypeToExcel = {
  freight: "Navlun",
  awrp: "AWRP",
  demurrage: "Demuraj",
  other: "Diğer",
} as const

const typeToDb = {
  Gelir: "income",
  Gider: "expense",
} as const

const typeToExcel = {
  income: "Gelir",
  expense: "Gider",
} as const

const statusToDb = {
  Beklemede: "pending",
  Ödendi: "paid",
  "Vadesi Geçti": "overdue",
  İptal: "cancelled",
} as const

const statusToExcel = {
  pending: "Beklemede",
  paid: "Ödendi",
  overdue: "Vadesi Geçti",
  cancelled: "İptal",
} as const

const commissionStatusToDb = {
  Beklemede: "pending",
  "Tahsil Edildi": "received",
  Gecikmiş: "overdue",
} as const

const commissionStatusToExcel = {
  pending: "Beklemede",
  received: "Tahsil Edildi",
  overdue: "Gecikmiş",
} as const


export function generateInvoiceTemplate(): Blob {
  const template: InvoiceExcelRow[] = [
    {
      "Fatura No": "INV-2024-001",
      "Fatura Tarihi": "2024-01-15",
      "Vade Tarihi": "2024-02-15",
      "Fatura Türü": "Navlun",
      Tip: "Gelir",
      "Gemi Adı": "MV EXAMPLE",
      Kiracı: "ABC Shipping Co.",
      Tutar: 50000,
      "Para Birimi": "USD",
      Durum: "Beklemede",
      "Komisyon Oranı (%)": 2.5,
      "Komisyon Tutarı": 1250,
      "Komisyon Durumu": "Beklemede",
      Açıklama: "Örnek fatura açıklaması",
      Notlar: "Örnek notlar",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(template)

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Fatura No
    { wch: 12 }, // Fatura Tarihi
    { wch: 12 }, // Vade Tarihi
    { wch: 12 }, // Fatura Türü
    { wch: 8 }, // Tip
    { wch: 20 }, // Gemi Adı
    { wch: 20 }, // Kiracı
    { wch: 12 }, // Tutar
    { wch: 10 }, // Para Birimi
    { wch: 12 }, // Durum
    { wch: 15 }, // Komisyon Oranı
    { wch: 15 }, // Komisyon Tutarı
    { wch: 15 }, // Komisyon Durumu
    { wch: 30 }, // Açıklama
    { wch: 30 }, // Notlar
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Faturalar")

  // Add instructions sheet
  const instructions = [
    ["Fatura İçe Aktarma Talimatları"],
    [""],
    ["1. Bu şablonu doldurun"],
    ["2. Tarih formatı: YYYY-MM-DD (örn: 2024-01-15)"],
    ["3. Fatura Türü: Navlun, AWRP, Demuraj, Diğer"],
    ["4. Tip: Gelir veya Gider"],
    ["5. Durum: Beklemede, Ödendi, Vadesi Geçti, İptal"],
    ["6. Komisyon Durumu: Beklemede, Tahsil Edildi, Gecikmiş"],
    ["7. Para Birimi: USD, EUR, TRY vb."],
    ["8. Dosyayı kaydedin ve sisteme yükleyin"],
  ]
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Talimatlar")

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

export function parseInvoiceExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<InvoiceExcelRow>(worksheet)

        const invoices = jsonData.map((row) => ({
          invoice_number: row["Fatura No"],
          invoice_date: row["Fatura Tarihi"],
          due_date: row["Vade Tarihi"],
          invoice_type: invoiceTypeToDb[row["Fatura Türü"] as keyof typeof invoiceTypeToDb] || "other",
          type: typeToDb[row["Tip"] as keyof typeof typeToDb] || "income",
          ship_name: row["Gemi Adı"],
          charterer: row["Kiracı"],
          amount: Number(row["Tutar"]),
          currency: row["Para Birimi"] || "USD",
          status: statusToDb[row["Durum"] as keyof typeof statusToDb] || "pending",
          broker_commission_rate: Number(row["Komisyon Oranı (%)"]) || 0,
          broker_commission: Number(row["Komisyon Tutarı"]) || 0,
          broker_commission_status:
            commissionStatusToDb[row["Komisyon Durumu"] as keyof typeof commissionStatusToDb] || "pending",
          description: row["Açıklama"] || "",
          notes: row["Notlar"] || "",
        }))

        resolve(invoices)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Dosya okuma hatası"))
    reader.readAsBinaryString(file)
  })
}

export function exportInvoicesToExcel(invoices: any[]): void {
  const data: InvoiceExcelRow[] = invoices.map((invoice) => ({
    "Fatura No": invoice.invoice_number,
    "Fatura Tarihi": new Date(invoice.invoice_date).toISOString().split("T")[0],
    "Vade Tarihi": invoice.due_date ? new Date(invoice.due_date).toISOString().split("T")[0] : "",
    "Fatura Türü": invoiceTypeToExcel[invoice.invoice_type as keyof typeof invoiceTypeToExcel] || "Diğer",
    Tip: typeToExcel[invoice.type as keyof typeof typeToExcel] || "Gelir",
    "Gemi Adı": invoice.ship_name || "",
    Kiracı: invoice.charterer || "",
    Tutar: Number(invoice.amount),
    "Para Birimi": invoice.currency || "USD",
    Durum: statusToExcel[invoice.status as keyof typeof statusToExcel] || "Beklemede",
    "Komisyon Oranı (%)": Number(invoice.broker_commission_rate) || 0,
    "Komisyon Tutarı": Number(invoice.broker_commission) || 0,
    "Komisyon Durumu":
      commissionStatusToExcel[invoice.broker_commission_status as keyof typeof commissionStatusToExcel] || "Beklemede",
    Açıklama: invoice.description || "",
    Notlar: invoice.notes || "",
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
    { wch: 30 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Faturalar")

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

  // Create download link and trigger download
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `faturalar_${new Date().toISOString().split("T")[0]}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
