"use client"

import { useState } from "react"
import { Anchor, Search, Download, Copy, Fuel, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { exportShipsToExcel } from "@/lib/excel-export"
import { useShips } from "@/lib/hooks/use-data-fetching"
import { useToastNotification } from "@/components/toast-provider"
import { BulkActionsBar } from "@/components/bulk-actions-bar"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { ErrorBoundary } from "@/components/error-boundary"

interface Ship {
  id: string
  name: string
  imo_number: string | null
  flag: string | null
  vessel_type: string | null
  dwt: number | null
  built_year: number | null
  status: string
  fleet_name: string
  company_name: string
  grt: number | null
  nrt: number | null
  main_engine: string | null
  current_position: string | null
  latitude: number | null
  longitude: number | null
  consumption_operations?: any
}

export function AllShipsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>("all")
  const {
    data: ships = [],
    isLoading: loading,
    error,
    refresh,
  } = useShips({
    status: statusFilter,
    type: vesselTypeFilter,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedShips, setSelectedShips] = useState<Set<string>>(new Set())
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingShip, setEditingShip] = useState<Ship | null>(null)

  const toast = useToastNotification()

  const filteredShips = ships.filter((ship) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      ship.name.toLowerCase().includes(query) ||
      ship.imo_number?.toLowerCase().includes(query) ||
      ship.flag?.toLowerCase().includes(query) ||
      ship.company_name.toLowerCase().includes(query)
    const matchesStatus = statusFilter === "all" || ship.status === statusFilter
    const matchesType = vesselTypeFilter === "all" || ship.vessel_type === vesselTypeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const vesselTypes = Array.from(new Set(ships.map((s) => s.vessel_type).filter(Boolean)))

  const handleExport = () => {
    exportShipsToExcel(filteredShips)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShips(new Set(filteredShips.map((ship) => ship.id)))
    } else {
      setSelectedShips(new Set())
    }
  }

  const handleSelectShip = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedShips)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedShips(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedShips.size === 0) return
    if (!confirm(`${selectedShips.size} gemiyi silmek istediğinizden emin misiniz?`)) return

    try {
      await Promise.all(Array.from(selectedShips).map((id) => fetch(`/api/ships/${id}`, { method: "DELETE" })))
      setSelectedShips(new Set())
      refresh()
      toast.success("Gemiler başarıyla silindi", `${selectedShips.size} gemi silindi`)
    } catch (error) {
      console.error("Error deleting ships:", error)
      toast.error("Silme işlemi başarısız", "Gemiler silinirken bir hata oluştu")
    }
  }

  const handleBulkExport = () => {
    const selected = ships.filter((ship) => selectedShips.has(ship.id))
    exportShipsToExcel(selected)
    toast.success("Dışa aktarma başarılı", `${selected.length} gemi Excel'e aktarıldı`)
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedShips.size === 0) return
    if (!confirm(`${selectedShips.size} geminin durumunu güncellemek istediğinizden emin misiniz?`)) return

    try {
      await Promise.all(
        Array.from(selectedShips).map((id) =>
          fetch(`/api/ships/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }),
        ),
      )
      setSelectedShips(new Set())
      refresh()
      toast.success("Durum güncellendi", `${selectedShips.size} geminin durumu güncellendi`)
    } catch (error) {
      console.error("Error updating ships:", error)
      toast.error("Güncelleme başarısız", "Durum güncellenirken bir hata oluştu")
    }
  }

  const handleCopy = async (ship: Ship) => {
    try {
      const response = await fetch(`/api/ships/${ship.id}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const copiedShip = await response.json()
        refresh()
        setEditingShip(copiedShip)
        setEditDialogOpen(true)
        toast.success("Gemi kopyalandı", "Gemi başarıyla kopyalandı")
      } else {
        console.error("[v0] Copy ship failed:", await response.text())
        toast.error("Kopyalama başarısız", "Gemi kopyalanırken bir hata oluştu")
      }
    } catch (error) {
      console.error("[v0] Copy ship error:", error)
      toast.error("Kopyalama başarısız", "Gemi kopyalanırken bir hata oluştu")
    }
  }

  if (loading) {
    return <SkeletonList items={6} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Gemiler yüklenirken bir hata oluştu</p>
          <Button onClick={refresh} variant="outline" className="mt-4 bg-transparent">
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <BulkActionsBar
          selectedCount={selectedShips.size}
          onClearSelection={() => setSelectedShips(new Set())}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onStatusUpdate={handleBulkStatusUpdate}
          statusOptions={[
            { value: "active", label: "Aktif" },
            { value: "inactive", label: "Pasif" },
            { value: "maintenance", label: "Bakımda" },
            { value: "idle", label: "Boşta" },
            { value: "anchored", label: "Demirde" },
            { value: "in_port", label: "Limanda" },
            { value: "at_sea", label: "Seferde" },
          ]}
        />

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Gemi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
              <SelectItem value="maintenance">Bakımda</SelectItem>
              <SelectItem value="idle">Boşta</SelectItem>
              <SelectItem value="anchored">Demirde</SelectItem>
              <SelectItem value="in_port">Limanda</SelectItem>
              <SelectItem value="at_sea">Seferde</SelectItem>
            </SelectContent>
          </Select>
          <Select value={vesselTypeFilter} onValueChange={setVesselTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Gemi Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              {vesselTypes.map((type) => (
                <SelectItem key={type} value={type!}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={filteredShips.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Excel İndir
          </Button>
        </div>

        {filteredShips.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
            <Checkbox
              checked={selectedShips.size === filteredShips.length}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Tümünü Seç ({filteredShips.length} gemi)
            </label>
          </div>
        )}

        {filteredShips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Anchor className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || vesselTypeFilter !== "all"
                  ? "Arama sonucu bulunamadı"
                  : "Henüz gemi bulunmuyor"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredShips.map((ship) => (
              <Card key={ship.id} className="hover:shadow-lg transition-shadow relative">
                <div className="absolute top-4 right-4 z-10">
                  <Checkbox
                    checked={selectedShips.has(ship.id)}
                    onCheckedChange={(checked) => handleSelectShip(ship.id, checked as boolean)}
                  />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Anchor className="h-5 w-5" />
                    {ship.name}
                  </CardTitle>
                  <CardDescription>
                    {ship.company_name} - {ship.fleet_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    {ship.imo_number && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">IMO:</span> {ship.imo_number}
                      </p>
                    )}
                    {ship.vessel_type && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Tip:</span> {ship.vessel_type}
                      </p>
                    )}
                    {ship.flag && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Bayrak:</span> {ship.flag}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      {ship.dwt && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">DWT:</span> {ship.dwt.toLocaleString()} MT
                        </p>
                      )}
                      {ship.grt && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">GRT:</span> {ship.grt.toLocaleString()}
                        </p>
                      )}
                      {ship.nrt && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">NRT:</span> {ship.nrt.toLocaleString()}
                        </p>
                      )}
                      {ship.main_engine && (
                        <p className="text-muted-foreground col-span-2">
                          <span className="font-medium">Makine:</span> {ship.main_engine}
                        </p>
                      )}
                    </div>
                    {ship.consumption_operations && (
                      <Collapsible className="pt-2 border-t">
                        <CollapsibleTrigger className="flex items-center gap-1 w-full hover:bg-muted/50 p-1 rounded">
                          <Fuel className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-xs">Yakıt Tüketimi</span>
                          <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          <div className="text-xs space-y-1 bg-muted/30 p-2 rounded">
                            <p className="font-medium mb-1">Operasyonel Tüketim (MT/gün):</p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                              {ship.consumption_operations.laden && (
                                <p>
                                  Yüklü: {ship.consumption_operations.laden.fo}+{ship.consumption_operations.laden.mgo}
                                </p>
                              )}
                              {ship.consumption_operations.ballast && (
                                <p>
                                  Boş: {ship.consumption_operations.ballast.fo}+
                                  {ship.consumption_operations.ballast.mgo}
                                </p>
                              )}
                              {ship.consumption_operations.loading && (
                                <p>
                                  Yükleme: {ship.consumption_operations.loading.fo}+
                                  {ship.consumption_operations.loading.mgo}
                                </p>
                              )}
                              {ship.consumption_operations.discharge && (
                                <p>
                                  Tahliye: {ship.consumption_operations.discharge.fo}+
                                  {ship.consumption_operations.discharge.mgo}
                                </p>
                              )}
                              {ship.consumption_operations.anchor && (
                                <p>
                                  Demir: {ship.consumption_operations.anchor.fo}+
                                  {ship.consumption_operations.anchor.mgo}
                                </p>
                              )}
                              {ship.consumption_operations.idle && (
                                <p>
                                  Idle: {ship.consumption_operations.idle.fo}+{ship.consumption_operations.idle.mgo}
                                </p>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    {ship.current_position && (
                      <p className="text-muted-foreground pt-2 border-t">
                        <span className="font-medium">Pozisyon:</span> {ship.current_position}
                      </p>
                    )}
                    {ship.latitude && ship.longitude && (
                      <p className="text-muted-foreground text-xs">
                        📍 {ship.latitude.toFixed(4)}°, {ship.longitude.toFixed(4)}°
                      </p>
                    )}
                    <div className="pt-2">
                      <Badge
                        variant={
                          ship.status === "active" || ship.status === "at_sea"
                            ? "default"
                            : ship.status === "idle" || ship.status === "anchored"
                              ? "secondary"
                              : ship.status === "in_port"
                                ? "outline"
                                : "secondary"
                        }
                      >
                        {ship.status === "active"
                          ? "Aktif"
                          : ship.status === "inactive"
                            ? "Pasif"
                            : ship.status === "maintenance"
                              ? "Bakımda"
                              : ship.status === "idle"
                                ? "Boşta"
                                : ship.status === "anchored"
                                  ? "Demirde"
                                  : ship.status === "in_port"
                                    ? "Limanda"
                                    : ship.status === "at_sea"
                                      ? "Seferde"
                                      : ship.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/ships/${ship.id}`}>Detaylar</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(ship)} title="Kopyala">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
