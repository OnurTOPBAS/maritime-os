"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ShipIcon, Filter } from "lucide-react"
import { EnhancedShipCard } from "@/components/enhanced-ship-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ShipsListProps {
  ships: {
    id: string
    name: string
    imo_number?: string
    flag?: string
    dwt?: string
    built_year?: number
    ship_type?: string
    status?: string
    fleet_name?: string
    fleet_id?: string
  }[]
}

export function ShipsList({ ships }: ShipsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredShips = ships.filter((ship) => {
    const matchesSearch =
      ship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.imo_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.fleet_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ship.status === statusFilter
    const matchesType = typeFilter === "all" || ship.ship_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const shipTypes = Array.from(new Set(ships.map((s) => s.ship_type).filter(Boolean)))
  const statuses = Array.from(new Set(ships.map((s) => s.status).filter(Boolean)))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Gemi adı, IMO veya filo ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status!}>
                    {status === "active" ? "Aktif" : status === "maintenance" ? "Bakımda" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Gemi Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                {shipTypes.map((type) => (
                  <SelectItem key={type} value={type!}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setTypeFilter("all")
                }}
              >
                Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredShips.length} gemi bulundu {ships.length !== filteredShips.length && `(${ships.length} toplam)`}
        </p>
      </div>

      {filteredShips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShipIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gemi Bulunamadı</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Arama kriterlerinize uygun gemi bulunamadı. Filtreleri değiştirmeyi deneyin."
                : "Henüz hiç gemi eklenmemiş."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredShips.map((ship) => (
            <EnhancedShipCard key={ship.id} ship={ship} />
          ))}
        </div>
      )}
    </div>
  )
}
