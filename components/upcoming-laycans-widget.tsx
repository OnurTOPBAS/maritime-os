import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Fixture {
  id: string
  charterer: string
  ship_name: string
  laycan_start: string | null
  laycan_end: string | null
  loading_ports: string[]
  status: string
}

interface UpcomingLaycansWidgetProps {
  fixtures: Fixture[]
}

export function UpcomingLaycansWidget({ fixtures }: UpcomingLaycansWidgetProps) {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const upcomingFixtures = fixtures
    .filter((fixture) => {
      if (!fixture.laycan_start) return false
      const laycanDate = new Date(fixture.laycan_start)
      return laycanDate >= now && laycanDate <= thirtyDaysFromNow
    })
    .sort((a, b) => {
      const dateA = new Date(a.laycan_start!).getTime()
      const dateB = new Date(b.laycan_start!).getTime()
      return dateA - dateB
    })
    .slice(0, 5)

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const diffInMs = date.getTime() - now.getTime()
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
    return diffInDays
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return "destructive"
    if (days <= 14) return "default"
    return "secondary"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Yaklaşan Laycan'lar
        </CardTitle>
        <CardDescription>30 gün içinde başlayacak fixture'lar</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingFixtures.length > 0 ? (
          <div className="space-y-3">
            {upcomingFixtures.map((fixture) => {
              const daysUntil = getDaysUntil(fixture.laycan_start!)
              return (
                <Link
                  key={fixture.id}
                  href={`/dashboard/fixtures/${fixture.id}`}
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{fixture.ship_name}</p>
                        <Badge variant={getUrgencyColor(daysUntil)} className="text-xs">
                          {daysUntil} gün
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{fixture.charterer}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fixture.loading_ports?.join(", ") || "Liman belirtilmemiş"}
                      </p>
                    </div>
                    {daysUntil <= 7 && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>30 gün içinde başlayacak laycan bulunmuyor</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
