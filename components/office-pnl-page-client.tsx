"use client"

import { useState } from "react"
import { format } from "date-fns"
import { OfficePnlList } from "@/components/office-pnl-list"
import { OfficePnlMonthlySelector } from "@/components/office-pnl-monthly-selector"
import { OfficePnlBankBalances } from "@/components/office-pnl-bank-balances"
import { OfficePnlMonthlyComparison } from "@/components/office-pnl-monthly-comparison"
import { OfficePnlSummary } from "@/components/office-pnl-summary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, List, Calendar } from "lucide-react"

export function OfficePnlPageClient() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  )
  // Kayıt/bakiye değişince özet ve bakiyeler yeniden çekilsin.
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey((k) => k + 1)

  return (
    <div className="space-y-6">
      {/* Genel özet (tüm şirketler): Kasa + bu ay gelir/gider/net */}
      <OfficePnlSummary reportMonth={selectedMonth} refreshKey={refreshKey} />

      {/* Ay seçici (artık tam genişlik) */}
      <OfficePnlMonthlySelector
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* Tabs for List and Comparison */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            İşlemler
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Aylık Karşılaştırma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <OfficePnlList reportMonth={selectedMonth} onChanged={bump} />
        </TabsContent>

        <TabsContent value="comparison">
          <OfficePnlMonthlyComparison currentMonth={selectedMonth} />
        </TabsContent>
      </Tabs>

      {/* Hesap Bakiyeleri en altta — Office PnL'in altında */}
      <OfficePnlBankBalances reportMonth={selectedMonth} refreshKey={refreshKey} onChanged={bump} />
    </div>
  )
}
