"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ship, Navigation, Fuel, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface VoyageStats {
  totalVoyages: number
  ongoingVoyages: number
  completedVoyages: number
  averageDuration: number
  totalDistance: number
  totalFuelConsumption: number
  performanceMetrics: {
    shipName: string
    voyageCount: number
    avgDistance: number
    avgFuel: number
  }[]
}

export function VoyagesDashboard() {
  const [stats, setStats] = useState<VoyageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1]

      const response = await fetch("/api/voyages/stats", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching voyage stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  if (!stats) {
    return <div className="text-center py-8">İstatistikler yüklenemedi</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sefer</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVoyages || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.ongoingVoyages || 0} devam ediyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Süre</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDuration || 0} gün</div>
            <p className="text-xs text-muted-foreground">Sefer süresi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Mesafe</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalDistance || 0).toLocaleString()} nm</div>
            <p className="text-xs text-muted-foreground">Deniz mili</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yakıt Tüketimi</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalFuelConsumption || 0).toLocaleString()} mt</div>
            <p className="text-xs text-muted-foreground">Metrik ton</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gemi Performansı</CardTitle>
          <CardDescription>Gemilere göre sefer sayısı ve ortalama yakıt tüketimi</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              voyageCount: {
                label: "Sefer Sayısı",
                color: "hsl(var(--chart-1))",
              },
              avgFuel: {
                label: "Ort. Yakıt (mt)",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shipName" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar yAxisId="left" dataKey="voyageCount" fill="hsl(var(--chart-1))" />
                <Bar yAxisId="right" dataKey="avgFuel" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
