import * as XLSX from "xlsx"

export interface VoyageExcelData {
  voyage_number: string
  fixture_id?: string
  load_port?: string
  discharge_port?: string
  eta_load?: string
  etd_load?: string
  eta_discharge?: string
  etd_discharge?: string
  cargo_quantity?: number
  cargo_unit?: string
  status: string
  notes?: string
}

export function generateVoyagesTemplate() {
  const template = [
    {
      "Sefer Numarası": "V-2024-001",
      "Fixture ID": "",
      "Yükleme Limanı": "Singapore",
      "Tahliye Limanı": "Rotterdam",
      "ETA Yükleme": "2024-03-01",
      "ETD Yükleme": "2024-03-03",
      "ETA Tahliye": "2024-03-20",
      "ETD Tahliye": "2024-03-22",
      "Kargo Miktarı": 75000,
      "Kargo Birimi": "MT",
      Durum: "planned",
      Notlar: "",
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Seferler")

  const instructions = [
    { Alan: "Sefer Numarası", Zorunlu: "Evet", Açıklama: "Benzersiz sefer numarası" },
    { Alan: "Durum", Zorunlu: "Evet", Açıklama: "planned, ongoing, completed, cancelled" },
  ]

  const wsInstructions = XLSX.utils.json_to_sheet(instructions)
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Talimatlar")

  XLSX.writeFile(wb, "seferler_sablonu.xlsx")
}

export function parseVoyagesExcel(file: File): Promise<VoyageExcelData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const voyages: VoyageExcelData[] = jsonData.map((row: any) => ({
          voyage_number: row["Sefer Numarası"] || row["voyage_number"],
          fixture_id: row["Fixture ID"] || row["fixture_id"],
          load_port: row["Yükleme Limanı"] || row["load_port"],
          discharge_port: row["Tahliye Limanı"] || row["discharge_port"],
          eta_load: row["ETA Yükleme"] || row["eta_load"],
          etd_load: row["ETD Yükleme"] || row["etd_load"],
          eta_discharge: row["ETA Tahliye"] || row["eta_discharge"],
          etd_discharge: row["ETD Tahliye"] || row["etd_discharge"],
          cargo_quantity: row["Kargo Miktarı"] || row["cargo_quantity"],
          cargo_unit: row["Kargo Birimi"] || row["cargo_unit"],
          status: row["Durum"] || row["status"] || "planned",
          notes: row["Notlar"] || row["notes"],
        }))

        resolve(voyages)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Dosya okunamadı"))
    reader.readAsBinaryString(file)
  })
}

export function exportVoyagesToExcel(voyages: any[]) {
  const data = voyages.map((voyage) => ({
    "Sefer Numarası": voyage.voyage_number,
    Gemi: voyage.ship_name || "",
    Charterer: voyage.charterer || "",
    "Yükleme Limanı": voyage.load_port || "",
    "Tahliye Limanı": voyage.discharge_port || "",
    "ETA Yükleme": voyage.eta_load || "",
    "ETD Yükleme": voyage.etd_load || "",
    "ETA Tahliye": voyage.eta_discharge || "",
    "ETD Tahliye": voyage.etd_discharge || "",
    "Kargo Miktarı": voyage.cargo_quantity || "",
    "Kargo Birimi": voyage.cargo_unit || "",
    Durum: voyage.status,
    Notlar: voyage.notes || "",
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Seferler")

  const fileName = `seferler_${new Date().toISOString().split("T")[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
