"use client"

import { Anchor, Calendar, Flag, Ship, TrendingUp, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ShipCardSettings } from "./ship-card-settings"

interface ShipData {
  id: string
  fleet_id: string
  name: string
  imo_number: string | null
  flag: string | null
  vessel_type: string | null
  dwt: number | null
  built_year: number | null
  status: string
  created_at: string
}

interface EnhancedShipCardProps {
  ship: ShipData
  settings: ShipCardSettings
  onEdit: (ship: ShipData) => void
  onDelete: (id: string) => void
}

const statusConfig = {
  active: { label: "Aktif", variant: "default" as const, color: "bg-green-500" },
  maintenance: { label: "Bakımda", variant: "secondary" as const, color: "bg-yellow-500" },
  inactive: { label: "Pasif", variant: "outline" as const, color: "bg-gray-500" },
}

export function EnhancedShipCard({ ship, settings, onEdit, onDelete }: EnhancedShipCardProps) {
  const statusInfo = statusConfig[ship.status as keyof typeof statusConfig] || statusConfig.active
  const isCompact = settings.viewMode === "compact"

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary/50">
      <CardHeader className={cn("pb-3", isCompact && "pb-2")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("rounded-full p-2 bg-primary/10 flex-shrink-0", isCompact && "p-1.5")}>
              <Ship className={cn("h-5 w-5 text-primary", isCompact && "h-4 w-4")} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className={cn("text-lg leading-tight truncate", isCompact && "text-base")}>
                {ship.name}
              </CardTitle>
              {settings.showVesselType && ship.vessel_type && (
                <p className={cn("text-sm text-muted-foreground mt-1", isCompact && "text-xs")}>{ship.vessel_type}</p>
              )}
            </div>
          </div>
          {settings.showStatus && (
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Badge variant={statusInfo.variant} className="whitespace-nowrap">
                {statusInfo.label}
              </Badge>
              <div className={cn("w-2 h-2 rounded-full", statusInfo.color)} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", isCompact && "space-y-2")}>
        {/* Ship Details */}
        {!isCompact && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {settings.showIMO && ship.imo_number && (
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">IMO</p>
                  <p className="font-medium truncate">{ship.imo_number}</p>
                </div>
              </div>
            )}
            {settings.showFlag && ship.flag && (
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Bayrak</p>
                  <p className="font-medium truncate">{ship.flag}</p>
                </div>
              </div>
            )}
            {settings.showDWT && ship.dwt && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">DWT</p>
                  <p className="font-medium truncate">{ship.dwt.toLocaleString()} MT</p>
                </div>
              </div>
            )}
            {settings.showBuiltYear && ship.built_year && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">İnşa</p>
                  <p className="font-medium">{ship.built_year}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact View */}
        {isCompact && (
          <div className="flex flex-wrap gap-2 text-xs">
            {settings.showIMO && ship.imo_number && (
              <span className="text-muted-foreground">
                <span className="font-medium">IMO:</span> {ship.imo_number}
              </span>
            )}
            {settings.showDWT && ship.dwt && (
              <span className="text-muted-foreground">
                <span className="font-medium">DWT:</span> {ship.dwt.toLocaleString()}
              </span>
            )}
            {settings.showBuiltYear && ship.built_year && (
              <span className="text-muted-foreground">
                <span className="font-medium">İnşa:</span> {ship.built_year}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className={cn("flex gap-2 pt-2 border-t", isCompact && "pt-1")}>
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link href={`/dashboard/ships/${ship.id}`}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Detaylar
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(ship)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Düzenle
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
