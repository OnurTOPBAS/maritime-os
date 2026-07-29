"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Anchor, MapPin } from "lucide-react"
import { useEffect, useState } from "react"

export function PortStatisticsWidget() {
  const [portStats, setPortStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPortStats() {
      try {
        const res = await fetch("/api/voyages")
        if (res.ok) {
          const voyages = await res.json()

          // Count port visits
          const portCounts: Record<string, number> = {}

          voyages.forEach((v: any) => {
            if (v.loading_ports && Array.isArray(v.loading_ports)) {
              v.loading_ports.forEach((port: any) => {
                const portName = typeof port === "string" ? port : port.port
                if (portName) {
                  portCounts[portName] = (portCounts[portName] || 0) + 1
                }
              })
            }
            if (v.discharge_ports && Array.isArray(v.discharge_ports)) {
              v.discharge_ports.forEach((port: any) => {
                const portName = typeof port === "string" ? port : port.port
                if (portName) {
                  portCounts[portName] = (portCounts[portName] || 0) + 1
                }
              })
            }
          })

          // Sort by frequency
          const sorted = Object.entries(portCounts)
            .map(([port, count]) => ({ port, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

          setPortStats(sorted)
        }
      } catch (error) {
        console.error("Error fetching port stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortStats()
  }, [])

  if (loading) {
    return (
      <Card className="border-l-4 border-l-cyan-500">
        <CardHeader>
          <CardTitle className="text-lg">Liman İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-cyan-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Liman İstatistikleri</CardTitle>
            <CardDescription>En çok ziyaret edilen limanlar</CardDescription>
          </div>
          <Anchor className="h-8 w-8 text-cyan-500" />
        </div>
      </CardHeader>
      <CardContent>
        {portStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz liman verisi yok</p>
        ) : (
          <div className="space-y-3">
            {portStats.map((stat, index) => (
              <div key={stat.port} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{stat.port}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-cyan-600">{stat.count} ziyaret</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
