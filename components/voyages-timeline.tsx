"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface Voyage {
  id: number
  ship_name: string
  departure_port: string
  arrival_port: string
  actual_departure: string
  actual_arrival: string
  status: string
  distance: number
}

export function VoyagesTimeline() {
  const [voyages, setVoyages] = useState<Voyage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVoyages()
  }, [])

  const fetchVoyages = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1]

      const response = await fetch("/api/voyages", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Sort by departure date
        const sortedVoyages = data.sort(
          (a: Voyage, b: Voyage) => new Date(a.actual_departure).getTime() - new Date(b.actual_departure).getTime(),
        )
        setVoyages(sortedVoyages)
      }
    } catch (error) {
      console.error("Error fetching voyages:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "planned":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ongoing":
        return "Devam Ediyor"
      case "completed":
        return "Tamamlandı"
      case "planned":
        return "Planlandı"
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sefer Zaman Çizelgesi</CardTitle>
        <CardDescription>Seferlerin tarihlerine göre sıralaması</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {voyages.map((voyage) => (
            <div key={voyage.id} className="flex items-start gap-4 border-l-2 border-muted pl-4 pb-4">
              <div className={`mt-1 h-3 w-3 rounded-full ${getStatusColor(voyage.status)}`} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{voyage.ship_name}</p>
                  <span className="text-sm text-muted-foreground">{getStatusText(voyage.status)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {voyage.departure_port} → {voyage.arrival_port}
                </p>
                <p className="text-sm">
                  {voyage.actual_departure && format(new Date(voyage.actual_departure), "dd MMM yyyy", { locale: tr })}
                  {voyage.actual_arrival &&
                    ` - ${format(new Date(voyage.actual_arrival), "dd MMM yyyy", { locale: tr })}`}
                </p>
                {voyage.distance && <p className="text-sm font-medium">{voyage.distance.toLocaleString()} nm</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
