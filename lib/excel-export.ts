export function exportToExcel(data: any[], filename: string, sheetName = "Sheet1") {
  // Convert data to CSV format
  if (data.length === 0) {
    alert("Dışa aktarılacak veri yok")
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Handle values with commas or quotes
          if (value === null || value === undefined) return ""
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(","),
    ),
  ].join("\n")

  // Create blob and download
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportInvoicesToExcel(invoices: any[]) {
  const exportData = invoices.map((invoice) => ({
    "Fatura No": invoice.invoice_number,
    Şirket: invoice.company_name,
    Tip: invoice.type === "income" ? "Gelir" : "Gider",
    Tutar: invoice.amount,
    "Para Birimi": invoice.currency,
    Durum: invoice.status,
    "Fatura Tarihi": new Date(invoice.invoice_date).toLocaleDateString("tr-TR"),
    "Vade Tarihi": invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("tr-TR") : "",
    Fixture: invoice.fixture_ref || "",
    Sefer: invoice.voyage_number || "",
    Açıklama: invoice.description || "",
  }))

  exportToExcel(exportData, `faturalar_${new Date().toISOString().split("T")[0]}`, "Faturalar")
}

export function exportShipsToExcel(ships: any[]) {
  const exportData = ships.map((ship) => ({
    "Gemi Adı": ship.name,
    "IMO No": ship.imo_number || "",
    Bayrak: ship.flag || "",
    "Gemi Tipi": ship.vessel_type || "",
    DWT: ship.dwt || "",
    "İnşa Yılı": ship.built_year || "",
    Durum: ship.status,
    Filo: ship.fleet_name,
    Şirket: ship.company_name,
  }))

  exportToExcel(exportData, `gemiler_${new Date().toISOString().split("T")[0]}`, "Gemiler")
}

export function exportFixturesToExcel(fixtures: any[]) {
  const exportData = fixtures.map((fixture) => ({
    Charterer: fixture.charterer,
    "Kargo Tipi": fixture.cargo_type || "",
    Rate: fixture.rate || "",
    "Rate Tipi": fixture.rate_type || "",
    "CP Tarihi": fixture.cp_date ? new Date(fixture.cp_date).toLocaleDateString("tr-TR") : "",
    "Laycan Başlangıç": fixture.laycan_from ? new Date(fixture.laycan_from).toLocaleDateString("tr-TR") : "",
    "Laycan Bitiş": fixture.laycan_to ? new Date(fixture.laycan_to).toLocaleDateString("tr-TR") : "",
    "Yükleme Limanı": fixture.load_port || "",
    "Tahliye Limanı": fixture.discharge_port || "",
    "Demurrage Rate": fixture.demurrage_rate || "",
    Durum: fixture.status,
    Notlar: fixture.notes || "",
  }))

  exportToExcel(exportData, `fixtures_${new Date().toISOString().split("T")[0]}`, "Fixtures")
}

export function exportVoyagesToExcel(voyages: any[]) {
  const exportData = voyages.map((voyage) => ({
    "Sefer No": voyage.voyage_number,
    "Yükleme Limanı": voyage.loading_port || "",
    "Tahliye Limanı": voyage.discharging_port || "",
    "Yükleme Tarihi": voyage.loading_date ? new Date(voyage.loading_date).toLocaleDateString("tr-TR") : "",
    "Tahliye Tarihi": voyage.discharging_date ? new Date(voyage.discharging_date).toLocaleDateString("tr-TR") : "",
    "Kargo Miktarı": voyage.cargo_quantity || "",
    "Laytime İzin": voyage.laytime_allowed || "",
    "Laytime Kullanılan": voyage.laytime_used || "",
    Demurrage: voyage.demurrage || "",
    Despatch: voyage.despatch || "",
    Durum: voyage.status,
    Notlar: voyage.notes || "",
  }))

  exportToExcel(exportData, `seferler_${new Date().toISOString().split("T")[0]}`, "Seferler")
}
