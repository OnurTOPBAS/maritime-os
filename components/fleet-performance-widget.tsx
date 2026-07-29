"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ship } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface FleetPerformanceWidgetProps {
  ships: any[]
  voyages: any[]
}

export function FleetPerformanceWidget({ ships, voyages }: FleetPerformanceWidgetProps) {
  const activeShips = ships.filter((s) => s.status === "active")
  const activeVoyages = voyages.filter((v) => ["loading", "loaded", "discharging"].includes(v.status))

  const utilizationRate = ships.length > 0 ? (activeVoyages.length / ships.length) * 100 : 0
  const avgVoyageDuration =
    voyages.length > 0 ? voyages.reduce((sum, v) => sum + (v.total_days || 0), 0) / voyages.length : 0

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Filo Performansı</CardTitle>
            <CardDescription>Genel filo kullanım ve verimlilik</CardDescription>
          </div>
          <Ship className="h-8 w-8 text-blue-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Filo Kullanım Oranı</span>
            <span className="text-sm font-bold text-blue-600">{utilizationRate.toFixed(1)}%</span>
          </div>
          <Progress value={utilizationRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Aktif Gemiler</p>
            <p className="text-2xl font-bold text-green-600">{activeShips.length}</p>
            <p className="text-xs text-muted-foreground">/ {ships.length} toplam</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Devam Eden Seferler</p>
            <p className="text-2xl font-bold text-blue-600">{activeVoyages.length}</p>
            <p className="text-xs text-muted-foreground">aktif sefer</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Ort. Sefer Süresi</span>
            <span className="text-sm font-semibold">{avgVoyageDuration.toFixed(1)} gün</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
