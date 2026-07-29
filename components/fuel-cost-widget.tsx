"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Fuel } from "lucide-react"
import { useEffect, useState } from "react"

export function FuelCostWidget() {
  const [fuelData, setFuelData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFuelData() {
      try {
        const res = await fetch("/api/voyages")
        if (res.ok) {
          const voyages = await res.json()

          const totalFuelCost = voyages.reduce((sum: number, v: any) => sum + (Number(v.total_fuel_cost) || 0), 0)

          const totalFO = voyages.reduce((sum: number, v: any) => sum + (Number(v.total_fo_consumption) || 0), 0)

          const totalMGO = voyages.reduce((sum: number, v: any) => sum + (Number(v.total_mgo_consumption) || 0), 0)

          setFuelData({
            totalCost: totalFuelCost,
            totalFO,
            totalMGO,
            avgCostPerVoyage: voyages.length > 0 ? totalFuelCost / voyages.length : 0,
          })
        }
      } catch (error) {
        console.error("Error fetching fuel data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFuelData()
  }, [])

  if (loading) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-lg">Yakıt Maliyetleri</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Yakıt Maliyetleri</CardTitle>
            <CardDescription>Toplam yakıt tüketimi ve maliyetler</CardDescription>
          </div>
          <Fuel className="h-8 w-8 text-orange-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Toplam Yakıt Maliyeti</p>
          <p className="text-3xl font-bold text-orange-600">${(fuelData?.totalCost || 0).toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">FO Tüketimi</p>
            <p className="text-lg font-semibold">{(fuelData?.totalFO || 0).toFixed(1)} MT</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">MGO Tüketimi</p>
            <p className="text-lg font-semibold">{(fuelData?.totalMGO || 0).toFixed(1)} MT</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Ort. Sefer Başı Maliyet</span>
            <span className="text-sm font-semibold">${(fuelData?.avgCostPerVoyage || 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
