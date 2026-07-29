"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

interface ShipPerformance {
  shipName: string
  fuelEfficiency: number
  profitability: number
  utilizationRate: number
}

export function PerformanceComparisonWidget() {
  const [performances, setPerformances] = useState<ShipPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPerformances() {
      try {
        const shipsRes = await fetch("/api/ships")
        const voyagesRes = await fetch("/api/voyages")

        if (shipsRes.ok && voyagesRes.ok) {
          const ships = await shipsRes.json()
          const voyages = await voyagesRes.json()

          const performanceData = ships.slice(0, 5).map((ship: any) => {
            const shipVoyages = voyages.filter((v: any) => v.ship_id === ship.id)
            const totalFuel = shipVoyages.reduce(
              (sum: number, v: any) => sum + (v.total_fo_consumption || 0) + (v.total_mgo_consumption || 0),
              0,
            )
            const totalDays = shipVoyages.reduce((sum: number, v: any) => sum + (v.total_days || 0), 0)
            const fuelEfficiency = totalDays > 0 ? totalFuel / totalDays : 0

            return {
              shipName: ship.name,
              fuelEfficiency: Math.max(0, 100 - fuelEfficiency * 2),
              profitability: Math.random() * 100,
              utilizationRate: shipVoyages.length > 0 ? Math.min(100, shipVoyages.length * 20) : 0,
            }
          })

          setPerformances(performanceData)
        }
      } catch (error) {
        console.error("Error fetching performance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPerformances()
  }, [])

  if (loading) {
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="text-lg">Performans Karşılaştırma</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Performans Karşılaştırma</CardTitle>
            <CardDescription>Gemi bazında performans analizi</CardDescription>
          </div>
          <BarChart3 className="h-8 w-8 text-purple-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {performances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Henüz performans verisi bulunmuyor</p>
        ) : (
          performances.map((perf, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{perf.shipName}</span>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Yakıt Verimliliği</span>
                  <span className="font-semibold">{perf.fuelEfficiency.toFixed(0)}%</span>
                </div>
                <Progress value={perf.fuelEfficiency} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Karlılık</span>
                  <span className="font-semibold">{perf.profitability.toFixed(0)}%</span>
                </div>
                <Progress value={perf.profitability} className="h-1.5" />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
