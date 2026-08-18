"use client"

import { useState, useEffect } from "react"
import { ModuleGuard } from "@/components/module-guard"
import { useRouter } from "next/navigation"
import { Calculator, Plus, Search, Ship, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { DataLabel } from "@/components/data-label"

interface Voyage {
  id: number
  voyage_number: string
  ship_id: number
  ship_name?: string
  start_date: string
  end_date?: string
  status: string
  total_revenue?: number
  total_cost?: number
  net_profit?: number
}

export default function VoyageAccountPage() {
  const router = useRouter()
  const [voyages, setVoyages] = useState<Voyage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchVoyages()
  }, [])

  const fetchVoyages = async () => {
    try {
      const response = await fetch("/api/voyages")
      if (response.ok) {
        const data = await response.json()
        setVoyages(data)
      }
    } catch (error) {
      console.error("Error fetching voyages:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVoyages = voyages.filter((voyage) => {
    const query = searchQuery.toLowerCase()
    return (
      voyage.voyage_number?.toLowerCase().includes(query) ||
      voyage.ship_name?.toLowerCase().includes(query) ||
      voyage.status?.toLowerCase().includes(query)
    )
  })

  const getProfitColor = (profit?: number) => {
    if (!profit) return "text-muted-foreground"
    return profit > 0 ? "text-green-600" : "text-red-600"
  }

  const getProfitIcon = (profit?: number) => {
    if (!profit) return null
    return profit > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
    switch (status.toLowerCase()) {
      case "completed":
        return "success"
      case "in_progress":
        return "info"
      case "planned":
        return "warning"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Tamamlandı"
      case "in_progress":
        return "Devam Ediyor"
      case "planned":
        return "Planlandı"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalRevenue = voyages.reduce((sum, v) => sum + (v.total_revenue || 0), 0)
  const totalCost = voyages.reduce((sum, v) => sum + (v.total_cost || 0), 0)
  const totalProfit = totalRevenue - totalCost

  return (
    <ModuleGuard module="voyage_account">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Sefer Hesabı
          </h1>
          <p className="text-muted-foreground mt-1">Sefer karlılık analizi ve maliyet takibi</p>
        </div>
        <Button onClick={() => router.push("/dashboard/voyages")}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sefer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">{voyages.length} sefer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm masraflar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
            {getProfitIcon(totalProfit)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(totalProfit)}`}>{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalProfit > 0 ? "Karlı" : "Zararlı"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Voyages List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seferler</CardTitle>
              <CardDescription>Sefer hesaplarını görüntüleyin ve yönetin</CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Sefer numarası, gemi adı veya durum ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredVoyages.length === 0 ? (
            <EmptyState
              icon={Calculator}
              title={searchQuery ? "Sefer bulunamadı" : "Henüz sefer yok"}
              description={
                searchQuery
                  ? "Arama kriterlerinize uygun sefer bulunamadı."
                  : "Sefer hesabı oluşturmak için önce bir sefer eklemelisiniz."
              }
              action={
                !searchQuery && (
                  <Button onClick={() => router.push("/dashboard/voyages")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Sefer Ekle
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4">
              {filteredVoyages.map((voyage) => (
                <Card
                  key={voyage.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/voyage-account/${voyage.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Ship className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{voyage.voyage_number}</h3>
                          <p className="text-sm text-muted-foreground">{voyage.ship_name || "Gemi seçilmedi"}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(voyage.status)}>{getStatusLabel(voyage.status)}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DataLabel icon={Calendar} label="Başlangıç" value={formatDate(voyage.start_date)} />
                      <DataLabel
                        icon={Calendar}
                        label="Bitiş"
                        value={voyage.end_date ? formatDate(voyage.end_date) : "Devam ediyor"}
                      />
                      <DataLabel
                        icon={DollarSign}
                        label="Gelir"
                        value={formatCurrency(voyage.total_revenue)}
                        className="text-green-600"
                      />
                      <DataLabel
                        icon={DollarSign}
                        label="Gider"
                        value={formatCurrency(voyage.total_cost)}
                        className="text-red-600"
                      />
                    </div>

                    {(voyage.total_revenue || voyage.total_cost) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Net Kar/Zarar:</span>
                          <div className={`flex items-center gap-2 font-bold ${getProfitColor(voyage.net_profit)}`}>
                            {getProfitIcon(voyage.net_profit)}
                            {formatCurrency(voyage.net_profit)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ModuleGuard>
  )
}
