import * as XLSX from "xlsx"

export interface FixtureExcelData {
  charterer: string
  ship_id?: string
  fixture_type?: string
  cargo_type?: string
  load_port?: string
  discharge_port?: string
  laycan_from?: string
  laycan_to?: string
  rate?: number
  rate_type?: string
  cp_date?: string
  status: string
  notes?: string
}

export function generateFixturesTemplate() {
  const template = [
    {
      Charterer: "ABC Shipping Co.",
      "Gemi ID": "",
      "Fixture Tipi": "Voyage",
      "Kargo Tipi": "Coal",
      "Yükleme Limanı": "Richards Bay",
      "Tahliye Limanı": "Rotterdam",
      "Laycan Başlangıç": "2024-03-01",
      "Laycan Bitiş": "2024-03-05",
      Navlun: 25000,
      "Navlun Tipi": "Lumpsum",
      "CP Tarihi": "2024-02-15",
      Durum: "fixed",
      Notlar: "",
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Fixtures")

  const instructions = [
    { Alan: "Charterer", Zorunlu: "Evet", Açıklama: "Kiracı firma adı" },
    { Alan: "Fixture Tipi", Zorunlu: "Hayır", Açıklama: "Voyage, Time Charter, vb." },
    { Alan: "Durum", Zorunlu: "Evet", Açıklama: "fixed, subs, cancelled" },
  ]

  const wsInstructions = XLSX.utils.json_to_sheet(instructions)
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Talimatlar")

  XLSX.writeFile(wb, "fixtures_sablonu.xlsx")
}

export function parseFixturesExcel(file: File): Promise<FixtureExcelData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const fixtures: FixtureExcelData[] = jsonData.map((row: any) => ({
          charterer: row["Charterer"] || row["charterer"],
          ship_id: row["Gemi ID"] || row["ship_id"],
          fixture_type: row["Fixture Tipi"] || row["fixture_type"],
          cargo_type: row["Kargo Tipi"] || row["cargo_type"],
          load_port: row["Yükleme Limanı"] || row["load_port"],
          discharge_port: row["Tahliye Limanı"] || row["discharge_port"],
          laycan_from: row["Laycan Başlangıç"] || row["laycan_from"],
          laycan_to: row["Laycan Bitiş"] || row["laycan_to"],
          rate: row["Navlun"] || row["rate"],
          rate_type: row["Navlun Tipi"] || row["rate_type"],
          cp_date: row["CP Tarihi"] || row["cp_date"],
          status: row["Durum"] || row["status"] || "fixed",
          notes: row["Notlar"] || row["notes"],
        }))

        resolve(fixtures)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Dosya okunamadı"))
    reader.readAsBinaryString(file)
  })
}

export function exportFixturesToExcel(fixtures: any[]) {
  const data = fixtures.map((fixture) => ({
    Charterer: fixture.charterer,
    Gemi: fixture.ship_name || "",
    "Fixture Tipi": fixture.fixture_type || "",
    "Kargo Tipi": fixture.cargo_type || "",
    "Yükleme Limanı": fixture.load_port || "",
    "Tahliye Limanı": fixture.discharge_port || "",
    "Laycan Başlangıç": fixture.laycan_from || "",
    "Laycan Bitiş": fixture.laycan_to || "",
    Navlun: fixture.rate || "",
    "Navlun Tipi": fixture.rate_type || "",
    "CP Tarihi": fixture.cp_date || "",
    Durum: fixture.status,
    Notlar: fixture.notes || "",
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Fixtures")

  const fileName = `fixtures_${new Date().toISOString().split("T")[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
