import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ship, MapPin } from "lucide-react"
import Link from "next/link"

interface Voyage {
  id: string
  voyage_number: string
  ship_name: string
  charterer: string
  loading_ports: any[]
  discharge_ports: any[]
  status: string
}

interface ActiveVoyagesWidgetProps {
  voyages: Voyage[]
}

export function ActiveVoyagesWidget({ voyages }: ActiveVoyagesWidgetProps) {
  const activeVoyages = voyages.filter((v) => v.status === "active").slice(0, 5)

  const getPortNames = (ports: any[]) => {
    if (!ports || ports.length === 0) return "Belirtilmemiş"
    return ports.map((p) => p.port_name).join(", ")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5" />
          Aktif Seferler
        </CardTitle>
        <CardDescription>Devam eden seferler</CardDescription>
      </CardHeader>
      <CardContent>
        {activeVoyages.length > 0 ? (
          <div className="space-y-3">
            {activeVoyages.map((voyage) => (
              <Link
                key={voyage.id}
                href={`/dashboard/voyages/${voyage.id}`}
                className="block p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{voyage.voyage_number}</p>
                      <Badge variant="default" className="text-xs">
                        Aktif
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{voyage.ship_name}</p>
                    <p className="text-xs text-muted-foreground">{voyage.charterer}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Yükleme: {getPortNames(voyage.loading_ports)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Tahliye: {getPortNames(voyage.discharge_ports)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Ship className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Aktif sefer bulunmuyor</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
