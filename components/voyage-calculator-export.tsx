"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, Table } from "lucide-react"

interface VoyageCalculatorExportProps {
  data: any
}

export function VoyageCalculatorExport({ data }: VoyageCalculatorExportProps) {
  const exportToPDF = () => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sefer Hesaplama Raporu - ${data.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .profit { color: #10b981; font-weight: bold; }
          .loss { color: #ef4444; font-weight: bold; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Sefer Hesaplama Raporu</h1>
        <div class="summary">
          <h2>Temel Bilgiler</h2>
          <p><strong>Hesaplama Adı:</strong> ${data.name}</p>
          <p><strong>Gemi:</strong> ${data.shipName}</p>
          <p><strong>Kiracı:</strong> ${data.charterer || "-"}</p>
          <p><strong>Toplam Gün:</strong> ${data.totalDays?.toFixed(2) || 0}</p>
        </div>
        
        ${
          data.legs && data.legs.length > 0
            ? `
        <h2>Rota Bacakları</h2>
        <table>
          <tr>
            <th>Çıkış Limanı</th>
            <th>Varış Limanı</th>
            <th>Mesafe (NM)</th>
            <th>Durum</th>
            <th class="text-right">Deniz Günü</th>
            <th class="text-right">FO (MT)</th>
            <th class="text-right">MGO (MT)</th>
          </tr>
          ${data.legs
            .map(
              (leg: any) => `
            <tr>
              <td>${leg.from_port || "-"}</td>
              <td>${leg.to_port || "-"}</td>
              <td class="text-right">${leg.distance_nm || 0}</td>
              <td>${leg.condition === "laden" ? "Yüklü" : "Boş"}</td>
              <td class="text-right">${leg.sea_days?.toFixed(2) || "0.00"}</td>
              <td class="text-right">${leg.fo_consumption?.toFixed(2) || "0.00"}</td>
              <td class="text-right">${leg.mgo_consumption?.toFixed(2) || "0.00"}</td>
            </tr>
          `,
            )
            .join("")}
        </table>
        `
            : ""
        }

        ${
          data.operations
            ? `
        <h2>Operasyon Detayları</h2>
        <table>
          <tr><th>Operasyon</th><th class="text-right">Gün</th></tr>
          <tr><td>Yükleme</td><td class="text-right">${data.operations.loading_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Tahliye</td><td class="text-right">${data.operations.discharge_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Yüklü Seyir</td><td class="text-right">${data.ladenDays?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Boş Seyir</td><td class="text-right">${data.ballastDays?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Demirde</td><td class="text-right">${data.operations.anchor_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Boşta</td><td class="text-right">${data.operations.idle_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Inerting ${data.operations.include_inerting_in_total ? "" : "(Toplama Dahil Değil)"}</td><td class="text-right">${data.operations.inerting_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Washing ${data.operations.include_washing_in_total ? "" : "(Toplama Dahil Değil)"}</td><td class="text-right">${data.operations.washing_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Heating ${data.operations.include_heating_in_total ? "" : "(Toplama Dahil Değil)"}</td><td class="text-right">${data.operations.heating_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>Incinerator ${data.operations.include_incinerator_in_total ? "" : "(Toplama Dahil Değil)"}</td><td class="text-right">${data.operations.incinerator_days?.toFixed(2) || "0.00"}</td></tr>
          <tr><th>Toplam</th><th class="text-right">${data.totalDays?.toFixed(2) || "0.00"}</th></tr>
        </table>
        `
            : ""
        }

        ${
          data.costItems && data.costItems.length > 0
            ? `
        <h2>Maliyet Kalemleri</h2>
        <table>
          <tr><th>Kategori</th><th>Açıklama</th><th class="text-right">Tutar (USD)</th></tr>
          ${data.costItems
            .map(
              (item: any) => `
            <tr>
              <td>${item.category}</td>
              <td>${item.description || "-"}</td>
              <td class="text-right">$${item.amount?.toLocaleString() || "0"}</td>
            </tr>
          `,
            )
            .join("")}
        </table>
        `
            : ""
        }

        ${
          data.revenueItems && data.revenueItems.length > 0
            ? `
        <h2>Gelir Kalemleri</h2>
        <table>
          <tr><th>Tür</th><th>Açıklama</th><th class="text-right">Tutar (USD)</th></tr>
          ${data.revenueItems
            .map(
              (item: any) => `
            <tr>
              <td>${item.type === "freight" ? "Navlun" : item.type === "demurrage" ? "Demurrage" : item.type === "despatch" ? "Despatch" : "Diğer"}</td>
              <td>${item.description || "-"}</td>
              <td class="text-right">$${item.amount?.toLocaleString() || "0"}</td>
            </tr>
          `,
            )
            .join("")}
        </table>
        `
            : ""
        }
        
        <h2>Finansal Özet</h2>
        <table>
          <tr><th>Kalem</th><th class="text-right">Tutar (USD)</th></tr>
          <tr><td>Yakıt Maliyeti</td><td class="text-right">$${data.fuelCost?.toLocaleString() || 0}</td></tr>
          <tr><td>Running Cost</td><td class="text-right">$${data.runningCost?.toLocaleString() || 0}</td></tr>
          <tr><td>Diğer Maliyetler</td><td class="text-right">$${data.otherCosts?.toLocaleString() || 0}</td></tr>
          <tr><th>Toplam Maliyet</th><th class="text-right">$${data.totalCost?.toLocaleString() || 0}</th></tr>
          <tr><th>Toplam Gelir</th><th class="text-right">$${data.totalRevenue?.toLocaleString() || 0}</th></tr>
          <tr><th>Net Kar/Zarar</th><th class="text-right ${data.netProfit >= 0 ? "profit" : "loss"}">$${data.netProfit?.toLocaleString() || 0}</th></tr>
          <tr><th>TCE Kar/Zarar ($/gün)</th><th class="text-right ${data.tceProfit >= 0 ? "profit" : "loss"}">$${data.tceProfit?.toFixed(2) || "0.00"}</th></tr>
        </table>

        <h2>Yakıt Tüketimi</h2>
        <table>
          <tr><th>Yakıt Tipi</th><th class="text-right">Toplam Tüketim (MT)</th></tr>
          <tr><td>FO (Fuel Oil)</td><td class="text-right">${data.totalFO?.toFixed(2) || "0.00"}</td></tr>
          <tr><td>MGO (Marine Gas Oil)</td><td class="text-right">${data.totalMGO?.toFixed(2) || "0.00"}</td></tr>
        </table>
      </body>
      </html>
    `

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sefer-hesaplama-${data.name || "rapor"}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    // Create CSV content with all data
    let csvContent = "Sefer Hesaplama Raporu\n\n"
    csvContent += `Hesaplama Adı,${data.name}\n`
    csvContent += `Gemi,${data.shipName}\n`
    csvContent += `Kiracı,${data.charterer || "-"}\n`
    csvContent += `Toplam Gün,${data.totalDays?.toFixed(2) || 0}\n\n`

    // Add legs data
    if (data.legs && data.legs.length > 0) {
      csvContent += "Rota Bacakları\n"
      csvContent += "Çıkış Limanı,Varış Limanı,Mesafe (NM),Durum,Deniz Günü,FO (MT),MGO (MT)\n"
      data.legs.forEach((leg: any) => {
        csvContent += `${leg.from_port || "-"},${leg.to_port || "-"},${leg.distance_nm || 0},${leg.condition === "laden" ? "Yüklü" : "Boş"},${leg.sea_days?.toFixed(2) || "0.00"},${leg.fo_consumption?.toFixed(2) || "0.00"},${leg.mgo_consumption?.toFixed(2) || "0.00"}\n`
      })
      csvContent += "\n"
    }

    // Add operations data
    if (data.operations) {
      csvContent += "Operasyon Detayları\n"
      csvContent += "Operasyon,Gün\n"
      csvContent += `Yükleme,${data.operations.loading_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Tahliye,${data.operations.discharge_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Yüklü Seyir,${data.ladenDays?.toFixed(2) || "0.00"}\n`
      csvContent += `Boş Seyir,${data.ballastDays?.toFixed(2) || "0.00"}\n`
      csvContent += `Demirde,${data.operations.anchor_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Boşta,${data.operations.idle_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Inerting ${data.operations.include_inerting_in_total ? "" : "(Toplama Dahil Değil)"},${data.operations.inerting_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Washing ${data.operations.include_washing_in_total ? "" : "(Toplama Dahil Değil)"},${data.operations.washing_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Heating ${data.operations.include_heating_in_total ? "" : "(Toplama Dahil Değil)"},${data.operations.heating_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Incinerator ${data.operations.include_incinerator_in_total ? "" : "(Toplama Dahil Değil)"},${data.operations.incinerator_days?.toFixed(2) || "0.00"}\n`
      csvContent += `Toplam,${data.totalDays?.toFixed(2) || "0.00"}\n\n`
    }

    // Add cost items
    if (data.costItems && data.costItems.length > 0) {
      csvContent += "Maliyet Kalemleri\n"
      csvContent += "Kategori,Açıklama,Tutar (USD)\n"
      data.costItems.forEach((item: any) => {
        csvContent += `${item.category},${item.description || "-"},${item.amount || 0}\n`
      })
      csvContent += "\n"
    }

    // Add revenue items
    if (data.revenueItems && data.revenueItems.length > 0) {
      csvContent += "Gelir Kalemleri\n"
      csvContent += "Tür,Açıklama,Tutar (USD)\n"
      data.revenueItems.forEach((item: any) => {
        const typeLabel =
          item.type === "freight"
            ? "Navlun"
            : item.type === "demurrage"
              ? "Demurrage"
              : item.type === "despatch"
                ? "Despatch"
                : "Diğer"
        csvContent += `${typeLabel},${item.description || "-"},${item.amount || 0}\n`
      })
      csvContent += "\n"
    }

    csvContent += "Finansal Özet\n"
    csvContent += "Kalem,Tutar (USD)\n"
    csvContent += `Yakıt Maliyeti,${data.fuelCost || 0}\n`
    csvContent += `Running Cost,${data.runningCost || 0}\n`
    csvContent += `Diğer Maliyetler,${data.otherCosts || 0}\n`
    csvContent += `Toplam Maliyet,${data.totalCost || 0}\n`
    csvContent += `Toplam Gelir,${data.totalRevenue || 0}\n`
    csvContent += `Net Kar/Zarar,${data.netProfit || 0}\n`
    csvContent += `TCE Kar/Zarar ($/gün),${data.tceProfit?.toFixed(2) || "0.00"}\n\n`

    csvContent += "Yakıt Tüketimi\n"
    csvContent += "Yakıt Tipi,Toplam Tüketim (MT)\n"
    csvContent += `FO (Fuel Oil),${data.totalFO?.toFixed(2) || "0.00"}\n`
    csvContent += `MGO (Marine Gas Oil),${data.totalMGO?.toFixed(2) || "0.00"}\n`

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sefer-hesaplama-${data.name || "rapor"}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Rapor İndir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          PDF/HTML Olarak İndir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <Table className="mr-2 h-4 w-4" />
          Excel/CSV Olarak İndir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
