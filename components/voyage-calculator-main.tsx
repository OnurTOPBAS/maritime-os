"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Calculator, GitCompare, Copy, ArrowLeft, TrendingUp, Trash2 } from "lucide-react"
import { VoyageCalculatorForm } from "./voyage-calculator-form"
import { VoyageCalculatorComparison } from "./voyage-calculator-comparison"
import { VoyageCalculatorFilters, type FilterState } from "./voyage-calculator-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { VoyageCalculatorDashboard } from "./voyage-calculator-dashboard"
import { VoyageCalculatorQuick } from "./voyage-calculator-quick"

interface Calculation {
  id: string
  name: string
  ship_name: string
  charterer: string
  service_speed: number
  total_days: number
  total_cost: number
  total_revenue: number
  net_profit: number
  created_at: string
  updated_at: string
  status?: string
  tags?: string[]
  legs?: Array<{
    from_port: string
    to_port: string
    condition: string
  }>
}

export function VoyageCalculatorMain() {
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [filteredCalculations, setFilteredCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showQuick, setShowQuick] = useState(false)

  useEffect(() => {
    fetchCalculations()
  }, [])

  const fetchCalculations = async () => {
    try {
      const response = await fetch("/api/voyage-calculator")
      if (response.ok) {
        const data = await response.json()
        setCalculations(data)
        setFilteredCalculations(data)
      }
    } catch (error) {
      console.error("[v0] Fetch calculations error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...calculations]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (calc) =>
          calc.name.toLowerCase().includes(searchLower) ||
          calc.ship_name.toLowerCase().includes(searchLower) ||
          calc.charterer?.toLowerCase().includes(searchLower),
      )
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((calc) => calc.status === filters.status)
    }

    // Profitability filter
    if (filters.profitability === "profitable") {
      filtered = filtered.filter((calc) => (calc.net_profit || 0) >= 0)
    } else if (filters.profitability === "unprofitable") {
      filtered = filtered.filter((calc) => (calc.net_profit || 0) < 0)
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((calc) => filters.tags.some((tag) => calc.tags?.includes(tag)))
    }

    setFilteredCalculations(filtered)
  }

  const handleNew = () => {
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("[v0] Duplicating calculation:", id)
    try {
      // Fetch the original calculation
      const getResponse = await fetch(`/api/voyage-calculator/${id}`)
      if (!getResponse.ok) {
        throw new Error("Hesaplama getirilemedi")
      }

      const original = await getResponse.json()
      console.log("[v0] Original calculation fetched:", original)

      // Create a copy with modified name
      const copy = {
        ...original,
        name: `${original.name} (Kopya)`,
        id: undefined, // Remove ID so a new one is generated
        created_at: undefined,
        updated_at: undefined,
      }

      // Post the copy as a new calculation
      const postResponse = await fetch("/api/voyage-calculator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(copy),
      })

      if (!postResponse.ok) {
        const error = await postResponse.text()
        throw new Error(error)
      }

      console.log("[v0] Duplicate successful")
      await fetchCalculations()
    } catch (error) {
      console.error("[v0] Duplicate calculation error:", error)
      alert("Kopyalama hatası: " + (error instanceof Error ? error.message : "Bilinmeyen hata"))
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Bu hesaplamayı silmek istediğinizden emin misiniz?")) {
      return
    }

    console.log("[v0] Deleting calculation:", id)
    try {
      const response = await fetch(`/api/voyage-calculator/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Hesaplama silinemedi")
      }

      console.log("[v0] Delete successful")
      await fetchCalculations()
    } catch (error) {
      console.error("[v0] Delete calculation error:", error)
      alert("Silme hatası: " + (error instanceof Error ? error.message : "Bilinmeyen hata"))
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingId(null)
    fetchCalculations()
  }

  const handleCompare = () => {
    setShowComparison(true)
  }

  const handleCloseComparison = () => {
    setShowComparison(false)
  }

  if (showForm) {
    return <VoyageCalculatorForm calculationId={editingId} onClose={handleClose} />
  }

  if (showComparison) {
    return <VoyageCalculatorComparison onClose={handleCloseComparison} />
  }

  if (showDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowDashboard(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analiz Dashboard</h1>
            <p className="text-muted-foreground mt-1">Sefer hesaplamalarınızın detaylı analizi</p>
          </div>
        </div>
        <VoyageCalculatorDashboard calculations={calculations} />
      </div>
    )
  }

  if (showQuick) {
    return <VoyageCalculatorQuick onClose={() => setShowQuick(false)} />
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            Sefer Hesaplama
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Sefer karlılık analizi ve maliyet hesaplama</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {calculations.length > 0 && (
            <>
              <Button
                onClick={() => setShowDashboard(true)}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none shadow-sm hover:shadow-md transition-all"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Analiz</span>
              </Button>
              <Button
                onClick={() => setShowQuick(true)}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none shadow-sm hover:shadow-md transition-all"
              >
                <Calculator className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Hızlı Hesaplama</span>
                <span className="sm:hidden">Hızlı</span>
              </Button>
            </>
          )}
          {calculations.length > 1 && (
            <Button
              onClick={handleCompare}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none shadow-sm hover:shadow-md transition-all bg-transparent"
            >
              <GitCompare className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Karşılaştır</span>
              <span className="sm:hidden">Karşılaştır</span>
            </Button>
          )}
          <Button
            onClick={handleNew}
            size="sm"
            className="flex-1 sm:flex-none shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Yeni Hesaplama</span>
            <span className="sm:hidden">Yeni</span>
          </Button>
        </div>
      </div>

      {calculations.length > 0 && <VoyageCalculatorFilters onFilterChange={handleFilterChange} />}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 shadow-lg">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : calculations.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Calculator className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Henüz hesaplama yok</h3>
          <p className="text-muted-foreground mb-6">İlk sefer hesaplamanızı oluşturun</p>
          <Button onClick={handleNew} size="lg" className="shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-5 w-5" />
            Yeni Hesaplama
          </Button>
        </Card>
      ) : filteredCalculations.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-lg">
          <p className="text-muted-foreground">Filtrelere uygun hesaplama bulunamadı</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCalculations.map((calc) => (
            <Card
              key={calc.id}
              className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer relative border-0 shadow-lg hover:scale-[1.02] bg-gradient-to-br from-background to-muted/20"
              onClick={() => handleEdit(calc.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg leading-tight pr-2">{calc.name}</h3>
                <div className="flex gap-1.5 flex-shrink-0 items-center">
                  {calc.status && (
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(calc.status)} text-white text-xs font-semibold px-3 py-1 shadow-sm`}
                    >
                      {calc.status === "approved" ? "Onaylandı" : calc.status === "rejected" ? "Reddedildi" : "Taslak"}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors bg-transparent"
                    onClick={(e) => handleDuplicate(calc.id, e)}
                    title="Kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors bg-transparent"
                    onClick={(e) => handleDelete(calc.id, e)}
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {calc.tags && calc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {calc.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs font-medium">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Gemi:</span>
                  <span className="font-semibold">{calc.ship_name}</span>
                </div>
                {calc.charterer && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Kiracı:</span>
                    <span className="font-semibold">{calc.charterer}</span>
                  </div>
                )}
                {calc.legs && calc.legs.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground font-medium">Rota:</span>
                    <span className="font-semibold text-right max-w-[60%]">
                      {calc.legs.map((leg, idx) => (
                        <span key={idx}>
                          {leg.from_port}
                          {idx === calc.legs!.length - 1 && ` - ${leg.to_port}`}
                          {idx < calc.legs!.length - 1 && " - "}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Toplam Gün:</span>
                  <span className="font-semibold">{calc.total_days?.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Toplam Maliyet:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${(calc.total_cost || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg ${(calc.net_profit || 0) >= 0 ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Net Kar:</span>
                  <span
                    className={`text-lg font-bold ${(calc.net_profit || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    ${(calc.net_profit || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
