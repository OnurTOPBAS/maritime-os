"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataLabel } from "@/components/data-label"
import { Badge } from "@/components/ui/badge"
import { Ship, Anchor } from "lucide-react"

interface VoyageAccountSummaryProps {
  data: any
}

export function VoyageAccountSummary({ data }: VoyageAccountSummaryProps) {
  const { voyage, legs, activities, bunkerPrices, costs, revenues } = data

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getStatusBadge = (status: string) => {
    const config = {
      planned: { variant: "info" as const, label: "Planlandı" },
      ongoing: { variant: "warning" as const, label: "Devam Ediyor" },
      completed: { variant: "success" as const, label: "Tamamlandı" },
      cancelled: { variant: "destructive" as const, label: "İptal" },
    }
    const statusConfig = config[status as keyof typeof config] || { variant: "outline" as const, label: status }
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Voyage Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Ship className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle>Sefer Bilgileri</CardTitle>
            </div>
            {getStatusBadge(voyage.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DataLabel label="Sefer Numarası" value={voyage.voyage_number} />
            <DataLabel label="Gemi Adı" value={voyage.ship_name} />
            <DataLabel label="IMO Numarası" value={voyage.imo_number || "-"} />
            <DataLabel label="DWT" value={voyage.dwt ? `${voyage.dwt.toLocaleString()} MT` : "-"} />
            <DataLabel label="Kiracı" value={voyage.charterer} />
            <DataLabel label="Servis Hızı" value={voyage.service_speed ? `${voyage.service_speed} knot` : "-"} />
            <DataLabel
              label="Günlük Running Cost"
              value={voyage.daily_running_cost ? `$${voyage.daily_running_cost.toLocaleString()}` : "-"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Route Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Anchor className="h-5 w-5" />
            </div>
            <CardTitle>Rota Özeti</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {legs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz rota bacağı eklenmemiş</p>
            ) : (
              <div className="space-y-3">
                {legs.map((leg: any, index: number) => (
                  <div key={leg.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <DataLabel label="Başlangıç" value={leg.from_port} />
                      <DataLabel label="Varış" value={leg.to_port} />
                      <DataLabel label="Mesafe" value={`${leg.distance_nm} nm`} />
                      <DataLabel label="Deniz Günü" value={`${leg.sea_days?.toFixed(2)} gün`} />
                    </div>
                    <Badge variant={leg.leg_type === "laden" ? "default" : "secondary"}>
                      {leg.leg_type === "laden" ? "Yüklü" : "Balast"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Costs Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maliyet Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">Yakıt Maliyeti</span>
              <span className="text-sm font-bold">${voyage.total_fuel_cost?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">Running Cost</span>
              <span className="text-sm font-bold">${voyage.total_running_cost?.toLocaleString() || "0"}</span>
            </div>
            {costs.map((cost: any) => (
              <div key={cost.id} className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">{cost.description || cost.cost_type}</span>
                <span className="text-sm font-semibold">${cost.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-3 pt-4 border-t-2">
              <span className="font-bold">Toplam Maliyet</span>
              <span className="text-lg font-bold text-destructive">${voyage.total_cost?.toLocaleString() || "0"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gelir Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revenues.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Henüz gelir kalemi eklenmemiş</p>
            ) : (
              <>
                {revenues.map((revenue: any) => (
                  <div key={revenue.id} className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">{revenue.description || revenue.revenue_type}</span>
                    <span className="text-sm font-semibold">${revenue.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3 pt-4 border-t-2">
                  <span className="font-bold">Toplam Gelir</span>
                  <span className="text-lg font-bold text-green-600">
                    ${voyage.total_revenue?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 pt-4 border-t-2 bg-muted/50 px-4 rounded-lg">
                  <span className="font-bold text-lg">Net Kar/Zarar</span>
                  <span
                    className={`text-xl font-bold ${(voyage.net_profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ${voyage.net_profit?.toLocaleString() || "0"}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fuel Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Yakıt Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">FO Tüketimi</p>
              <p className="text-2xl font-bold">{voyage.total_fo_consumption?.toFixed(2) || "0.00"} MT</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">MGO Tüketimi</p>
              <p className="text-2xl font-bold">{voyage.total_mgo_consumption?.toFixed(2) || "0.00"} MT</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Toplam Yakıt Maliyeti</p>
              <p className="text-2xl font-bold text-destructive">${voyage.total_fuel_cost?.toLocaleString() || "0"}</p>
            </div>
          </div>
          {bunkerPrices.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium mb-3">Güncel Yakıt Fiyatları</p>
              <div className="grid gap-4 md:grid-cols-2">
                <DataLabel label="FO Fiyatı" value={`$${bunkerPrices[0].fo_price}/MT`} />
                <DataLabel label="MGO Fiyatı" value={`$${bunkerPrices[0].mgo_price}/MT`} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Operasyon Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz operasyon eklenmemiş</p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.activity_name || activity.activity_type}</p>
                    <p className="text-xs text-muted-foreground">
                      FO: {activity.fo_consumption?.toFixed(2)} MT | MGO: {activity.mgo_consumption?.toFixed(2)} MT
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{activity.days?.toFixed(2)} gün</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 pt-4 border-t-2">
                <span className="font-bold">Toplam Operasyon Günü</span>
                <span className="text-lg font-bold">{voyage.total_days?.toFixed(2) || "0.00"} gün</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
