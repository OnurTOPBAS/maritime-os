"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface Fixture {
  id: number
  ship_name: string
  charterer: string
  laycan_from: string
  laycan_to: string
  status: string
  freight_rate: number
}

export function FixturesTimeline() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFixtures()
  }, [])

  const fetchFixtures = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1]

      const response = await fetch("/api/fixtures", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Sort by laycan_from date
        const sortedFixtures = data.sort(
          (a: Fixture, b: Fixture) => new Date(a.laycan_from).getTime() - new Date(b.laycan_from).getTime(),
        )
        setFixtures(sortedFixtures)
      }
    } catch (error) {
      console.error("Error fetching fixtures:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif"
      case "completed":
        return "Tamamlandı"
      case "pending":
        return "Beklemede"
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
        <CardTitle>Fixture Zaman Çizelgesi</CardTitle>
        <CardDescription>Fixture'ların laycan tarihlerine göre sıralaması</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="flex items-start gap-4 border-l-2 border-muted pl-4 pb-4">
              <div className={`mt-1 h-3 w-3 rounded-full ${getStatusColor(fixture.status)}`} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{fixture.ship_name}</p>
                  <span className="text-sm text-muted-foreground">{getStatusText(fixture.status)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Kiracı: {fixture.charterer}</p>
                <p className="text-sm">
                  {format(new Date(fixture.laycan_from), "dd MMM yyyy", { locale: tr })} -{" "}
                  {format(new Date(fixture.laycan_to), "dd MMM yyyy", { locale: tr })}
                </p>
                <p className="text-sm font-medium">${fixture.freight_rate?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
