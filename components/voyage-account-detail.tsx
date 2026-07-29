"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Ship,
  Route,
  Activity,
  Fuel,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { VoyageAccountSummary } from "@/components/voyage-account-summary"
import { VoyageLegsSection } from "@/components/voyage-legs-section"
import { VoyageActivitiesSection } from "@/components/voyage-activities-section"
import { VoyageBunkerSection } from "@/components/voyage-bunker-section"
import { VoyageCostsSection } from "@/components/voyage-costs-section"
import { VoyageRevenuesSection } from "@/components/voyage-revenues-section"

interface VoyageAccountDetailProps {
  voyageId: string
}

function safeNumber(value: any, defaultValue = 0): number {
  const num = Number.parseFloat(value)
  return isNaN(num) ? defaultValue : num
}

export function VoyageAccountDetail({ voyageId }: VoyageAccountDetailProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [voyageId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/voyage-account/${voyageId}/summary`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("[v0] Fetch voyage account error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // TODO: Implement CSV/Excel export
    console.log("Export to CSV/Excel")
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Sefer hesabı bulunamadı</p>
        </CardContent>
      </Card>
    )
  }

  const { voyage } = data
  const netProfit = safeNumber(voyage.net_profit)
  const isProfitable = netProfit >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/voyage-account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sefer Hesabı</h1>
            <p className="text-muted-foreground mt-1">
              {voyage.voyage_number} - {voyage.ship_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeNumber(voyage.total_days).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Operasyon günleri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yakıt Maliyeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${safeNumber(voyage.total_fuel_cost).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              FO: {safeNumber(voyage.total_fo_consumption).toFixed(2)} MT | MGO:{" "}
              {safeNumber(voyage.total_mgo_consumption).toFixed(2)} MT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Maliyet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${safeNumber(voyage.total_cost).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm masraflar dahil</p>
          </CardContent>
        </Card>

        <Card className={isProfitable ? "border-green-500/50" : "border-red-500/50"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Net Kar/Zarar
              {isProfitable ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? "text-green-600" : "text-red-600"}`}>
              ${netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gelir: ${safeNumber(voyage.total_revenue).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="summary" className="gap-2">
            <Ship className="h-4 w-4" />
            Özet
          </TabsTrigger>
          <TabsTrigger value="legs" className="gap-2">
            <Route className="h-4 w-4" />
            Rota
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2">
            <Activity className="h-4 w-4" />
            Operasyonlar
          </TabsTrigger>
          <TabsTrigger value="bunker" className="gap-2">
            <Fuel className="h-4 w-4" />
            Yakıt
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Maliyetler
          </TabsTrigger>
          <TabsTrigger value="revenues" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Gelirler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <VoyageAccountSummary data={data} />
        </TabsContent>

        <TabsContent value="legs">
          <VoyageLegsSection voyageId={voyageId} legs={data.legs} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="activities">
          <VoyageActivitiesSection voyageId={voyageId} activities={data.activities} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="bunker">
          <VoyageBunkerSection voyageId={voyageId} bunkerPrices={data.bunkerPrices} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="costs">
          <VoyageCostsSection voyageId={voyageId} costs={data.costs} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="revenues">
          <VoyageRevenuesSection voyageId={voyageId} revenues={data.revenues} onUpdate={fetchData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
