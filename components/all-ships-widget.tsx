"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ship, Anchor } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface AllShipsWidgetProps {
  ships: Array<{
    id: string
    name: string
    imo_number?: string
    flag?: string
    status: string
    fleet_id: string
  }>
  fleets: Array<{
    id: string
    name: string
    company_id: string
  }>
  companies: Array<{
    id: string
    name: string
  }>
}

export function AllShipsWidget({ ships, fleets, companies }: AllShipsWidgetProps) {
  const activeShips = ships.filter((s) => s.status === "active")

  const getShipDetails = (ship: any) => {
    const fleet = fleets.find((f) => f.id === ship.fleet_id)
    const company = companies.find((c) => c.id === fleet?.company_id)
    return { fleet, company }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "maintenance":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "inactive":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      default:
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif"
      case "maintenance":
        return "Bakımda"
      case "inactive":
        return "Pasif"
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-primary" />
            <CardTitle>Tüm Gemiler</CardTitle>
          </div>
          <Badge variant="secondary">{ships.length} Gemi</Badge>
        </div>
        <CardDescription>Filonuzdaki tüm gemilere hızlı erişim</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Henüz gemi eklenmemiş</p>
              <p className="text-xs mt-1">Şirketler → Filolar üzerinden gemi ekleyebilirsiniz</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {ships.slice(0, 10).map((ship) => {
                  const { fleet, company } = getShipDetails(ship)
                  return (
                    <Link
                      key={ship.id}
                      href={`/dashboard/ships/${ship.id}`}
                      className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Anchor className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="font-medium truncate">{ship.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {ship.imo_number && <span>IMO: {ship.imo_number}</span>}
                            {ship.flag && (
                              <>
                                <span>•</span>
                                <span>{ship.flag}</span>
                              </>
                            )}
                          </div>
                          {company && fleet && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {company.name} → {fleet.name}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(ship.status)} variant="secondary">
                          {getStatusText(ship.status)}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {ships.length > 10 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">+{ships.length - 10} gemi daha</p>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Gemilere <strong>Şirketler → Filolar</strong> üzerinden erişebilirsiniz
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
