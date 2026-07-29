"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calculator,
  Plus,
  Search,
  Ship,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  Calendar,
  Anchor,
  Copy,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VoyageCalculation {
  id: string
  calculation_number: string
  ship_name: string
  charterer_name?: string
  service_speed?: number
  daily_running_cost?: number
  total_days?: number
  total_revenue?: number
  total_cost?: number
  net_profit?: number
  status: string
  created_at: string
  legs?: { from_port?: string; to_port?: string }[]
}

export function VoyageCalculatorList() {
  const router = useRouter()
  const [calculations, setCalculations] = useState<VoyageCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [needsSetup, setNeedsSetup] = useState(false)
  const [settingUp, setSettingUp] = useState(false)

  useEffect(() => {
    fetchCalculations()
  }, [])

  const fetchCalculations = async () => {
    try {
      const response = await fetch("/api/voyage-calculator")

      if (response.status === 404) {
        const data = await response.json()
        if (data.error === "TABLE_NOT_EXISTS") {
          console.log("[v0] Table does not exist, showing setup UI")
          setNeedsSetup(true)
          setLoading(false)
          return
        }
      }

      if (response.ok) {
        const data = await response.json()
        setCalculations(data)
        setNeedsSetup(false)
      } else {
        console.error("[v0] Error response from API:", response.status)
      }
    } catch (error: any) {
      console.error("[v0] Error fetching voyage calculations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewCalculation = async () => {
    try {
      const response = await fetch("/api/voyage-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculation_number: `CALC-${Date.now()}`,
          status: "draft",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/voyage-calculator/${data.id}`)
      }
    } catch (error) {
      console.error("Error creating calculation:", error)
    }
  }

  const handleSetup = async () => {
    setSettingUp(true)
    try {
      const response = await fetch("/api/voyage-calculator/setup", {
        method: "POST",
      })

      if (response.ok) {
        console.log("[v0] Setup completed successfully")
        await fetchCalculations()
      } else {
        const error = await response.json()
        console.error("[v0] Setup failed:", error)
        alert("Kurulum başarısız oldu. Lütfen tekrar deneyin.")
      }
    } catch (error) {
      console.error("[v0] Setup error:", error)
      alert("Kurulum sırasında bir hata oluştu.")
    } finally {
      setSettingUp(false)
    }
  }

  const handleCopy = async (e: React.MouseEvent, calcId: string) => {
    e.stopPropagation()

    try {
      const response = await fetch(`/api/voyage-calculator/${calcId}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/voyage-calculator/${data.id}`)
      }
    } catch (error) {
      console.error("Error copying calculation:", error)
    }
  }

  const handleDelete = async (e: React.MouseEvent, calcId: string) => {
    e.stopPropagation()

    if (!confirm("Bu hesaplamayı silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/voyage-calculator/${calcId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchCalculations()
      }
    } catch (error) {
      console.error("Error deleting calculation:", error)
    }
  }

  const filteredCalculations = calculations.filter((calc) => {
    const query = searchQuery.toLowerCase()

    // Search in route legs (from_port and to_port)
    const routeMatch = calc.legs?.some(
      (leg) => leg.from_port?.toLowerCase().includes(query) || leg.to_port?.toLowerCase().includes(query),
    )

    return (
      calc.calculation_number?.toLowerCase().includes(query) ||
      calc.ship_name?.toLowerCase().includes(query) ||
      calc.charterer_name?.toLowerCase().includes(query) ||
      routeMatch
    )
  })

  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "finalized":
        return "success"
      case "draft":
        return "warning"
      case "converted_to_fixture":
        return "info"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "finalized":
        return "Tamamlandı"
      case "draft":
        return "Taslak"
      case "converted_to_fixture":
        return "Fixture'a Dönüştürüldü"
      default:
        return status
    }
  }

  const getProfitColor = (profit?: number) => {
    if (!profit) return "text-muted-foreground"
    return profit > 0 ? "text-green-600" : "text-red-600"
  }

  const getProfitIcon = (profit?: number) => {
    if (!profit) return null
    return profit > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Sefer Hesaplama
          </h1>
          <p className="text-muted-foreground mt-1">Sefer öncesi maliyet ve gelir analizi</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kurulum Gerekli</AlertTitle>
          <AlertDescription>
            Sefer Hesaplama modülünü kullanmak için veritabanı tablolarının oluşturulması gerekiyor. Kurulumu başlatmak
            için aşağıdaki butona tıklayın.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Veritabanı Kurulumu</CardTitle>
            <CardDescription>
              Bu işlem aşağıdaki tabloları oluşturacak:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>voyage_calculations - Ana hesaplama tablosu</li>
                <li>voyage_calc_legs - Rota bacakları</li>
                <li>voyage_calc_operations - Liman operasyonları</li>
                <li>voyage_calc_fuel_prices - Yakıt fiyatları</li>
                <li>voyage_calc_costs - Maliyet kalemleri</li>
                <li>voyage_calc_revenues - Gelir kalemleri</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSetup} disabled={settingUp} size="lg">
              {settingUp ? "Kuruluyor..." : "Kurulumu Başlat"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalRevenue = calculations.reduce((sum, c) => sum + (c.total_revenue || 0), 0)
  const totalCost = calculations.reduce((sum, c) => sum + (c.total_cost || 0), 0)
  const totalProfit = totalRevenue - totalCost

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            Sefer Hesaplama
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Sefer öncesi maliyet ve gelir analizi</p>
        </div>
        <Button onClick={handleNewCalculation} size="lg" className="shadow-md hover:shadow-lg transition-all">
          <Plus className="h-5 w-5 mr-2" />
          Yeni Hesaplama
        </Button>
      </div>

      {calculations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">
                Toplam Tahmini Gelir
              </CardTitle>
              <div className="p-2 bg-green-500 rounded-lg shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {calculations.length} hesaplama
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-100">
                Toplam Tahmini Gider
              </CardTitle>
              <div className="p-2 bg-red-500 rounded-lg shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalCost)}</div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                Tüm masraflar
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg ${totalProfit > 0 ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950" : "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle
                className={`text-sm font-semibold ${totalProfit > 0 ? "text-blue-900 dark:text-blue-100" : "text-orange-900 dark:text-orange-100"}`}
              >
                Tahmini Net Kar
              </CardTitle>
              <div className={`p-2 rounded-lg shadow-md ${totalProfit > 0 ? "bg-blue-500" : "bg-orange-500"}`}>
                {totalProfit > 0 ? (
                  <TrendingUp className="h-5 w-5 text-white" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-white" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${totalProfit > 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"}`}
              >
                {formatCurrency(totalProfit)}
              </div>
              <p
                className={`text-sm mt-2 flex items-center gap-1 font-medium ${totalProfit > 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}
              >
                {totalProfit > 0 ? "✓ Karlı" : "⚠ Zararlı"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Hesaplamalar</CardTitle>
              <CardDescription className="mt-1">Sefer hesaplamalarınızı görüntüleyin ve yönetin</CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hesaplama numarası, gemi, kiracı veya rota ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {filteredCalculations.length === 0 ? (
            <EmptyState
              icon={Calculator}
              title={searchQuery ? "Hesaplama bulunamadı" : "Henüz hesaplama yok"}
              description={
                searchQuery
                  ? "Arama kriterlerinize uygun hesaplama bulunamadı."
                  : "Yeni bir sefer hesaplaması oluşturmak için yukarıdaki butona tıklayın."
              }
              action={
                !searchQuery && (
                  <Button onClick={handleNewCalculation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Hesaplama
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-5">
              {filteredCalculations.map((calc) => (
                <Card
                  key={calc.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.01] bg-gradient-to-br from-background to-muted/20"
                  onClick={() => router.push(`/dashboard/voyage-calculator/${calc.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-md">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-1">{calc.calculation_number}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Ship className="h-4 w-4" />
                            <span className="font-medium">{calc.ship_name || "Gemi seçilmedi"}</span>
                          </div>
                          {calc.charterer_name && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Anchor className="h-3 w-3" />
                              <span>Kiracı: {calc.charterer_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getStatusVariant(calc.status)}
                          className="text-xs font-semibold px-3 py-1 shadow-sm"
                        >
                          {getStatusLabel(calc.status)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-all shadow-sm bg-transparent"
                          onClick={(e) => handleCopy(e, calc.id)}
                          title="Kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400 transition-all shadow-sm bg-transparent"
                          onClick={(e) => handleDelete(e, calc.id)}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Hız</p>
                        <p className="text-sm font-semibold">
                          {calc.service_speed ? `${calc.service_speed} knot` : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Günlük Maliyet</p>
                        <p className="text-sm font-semibold">
                          {calc.daily_running_cost ? formatCurrency(calc.daily_running_cost) : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Tahmini Gelir</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(calc.total_revenue)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Tahmini Gider</p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(calc.total_cost)}
                        </p>
                      </div>
                    </div>

                    {(calc.total_revenue || calc.total_cost) && (
                      <div
                        className={`p-4 rounded-lg ${calc.net_profit && calc.net_profit > 0 ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Tahmini Net Kar/Zarar:</span>
                          <div
                            className={`flex items-center gap-2 text-lg font-bold ${getProfitColor(calc.net_profit)}`}
                          >
                            {getProfitIcon(calc.net_profit)}
                            {formatCurrency(calc.net_profit)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Oluşturulma: {formatDate(calc.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
