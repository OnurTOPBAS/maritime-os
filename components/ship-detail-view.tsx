"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Anchor,
  Plus,
  Trash2,
  FileText,
  Search,
  Info,
  Copy,
  Receipt,
  Download,
  Edit,
  Ship,
  Gauge,
  MapPin,
  Fuel,
  ClipboardCheck,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FixtureForm } from "@/components/fixture-form"
import { ShipForm } from "@/components/ship-form"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentList } from "@/components/document-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShipCertificateList } from "@/components/ship-certificate-list"
import { PSCPreparationChecklist } from "@/components/psc-preparation-checklist"
import { VettingInspections } from "@/components/vetting-inspections"

interface ShipDetail {
  id: string
  name: string
  imo_number: string | null
  flag: string | null
  vessel_type: string | null
  built_year: number | null
  status: string | null
  dwt: number | null
  grt: number | null
  nrt: number | null
  main_engine: string | null
  engine_power: string | null
  speed_laden: number | null
  speed_ballast: number | null
  loa: number | null
  beam: number | null
  draft: number | null
  consumption_operations: any
  current_position: string | null
  latitude: number | null
  longitude: number | null
  fleet_name: string
  company_name: string
  fleet_id: string
  particulars_file_url: string | null
  fuel_consumption_file_url: string | null
}

interface Fixture {
  id: string
  ship_id: string
  charterer: string
  cargo_type: string | null
  rate: number | null
  rate_type: string | null
  cp_date: string | null
  laycan_from: string | null
  laycan_to: string | null
  load_port: string | null
  discharge_port: string | null
  demurrage_rate: number | null
  status: string
  notes: string | null
  created_at: string
}

interface Invoice {
  id: string
  ship_id: string
  invoice_number: string
  charterer: string
  invoice_date: string
  amount: string
  currency: string
  status: string
}

interface ShipDetailViewProps {
  ship: ShipDetail
  initialFixtures: Fixture[]
}

const TAB_ICONS = {
  info: Info,
  psc: ClipboardCheck,
  certificates: FileText,
  fixtures: FileText,
  invoices: Receipt,
  documents: Anchor,
}

export function ShipDetailView({ ship, initialFixtures }: ShipDetailViewProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>(initialFixtures)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [invoiceAttachments, setInvoiceAttachments] = useState<Record<string, any[]>>({})
  const [editShipDialogOpen, setEditShipDialogOpen] = useState(false)
  const [currentShip, setCurrentShip] = useState(ship)

  const [tabOrder, setTabOrder] = useState([
    { id: "info", label: "Bilgiler", shortLabel: "Info" },
    { id: "psc", label: "PSC/Vetting", shortLabel: "PSC" },
    { id: "certificates", label: "Sertifikalar", shortLabel: "Sert." },
    { id: "fixtures", label: `Fixture'lar`, shortLabel: `Fix` },
    { id: "invoices", label: `Faturalar`, shortLabel: `Fat` },
    { id: "documents", label: "Dokümanlar", shortLabel: "Dök." },
  ])
  const [draggedTab, setDraggedTab] = useState<number | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [ship.id])

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const response = await fetch(`/api/invoices?shipId=${ship.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(Array.isArray(data) ? data : [])

        const attachmentsMap: Record<string, any[]> = {}
        for (const invoice of data) {
          try {
            const attResponse = await fetch(`/api/invoice-attachments?invoiceId=${invoice.id}`)
            if (attResponse.ok) {
              const attachments = await attResponse.json()
              attachmentsMap[invoice.id] = attachments || []
            }
          } catch (error) {
            console.error(`Error fetching attachments for invoice ${invoice.id}:`, error)
          }
        }
        setInvoiceAttachments(attachmentsMap)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleFixtureCreated = (newFixture: Fixture) => {
    setFixtures([newFixture, ...fixtures])
    setIsDialogOpen(false)
  }

  const handleFixtureUpdated = (updatedFixture: Fixture) => {
    setFixtures(fixtures.map((f) => (f.id === updatedFixture.id ? updatedFixture : f)))
    setEditDialogOpen(false)
    setEditingFixture(null)
  }

  const handleEdit = (fixture: Fixture) => {
    setEditingFixture(fixture)
    setEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu fixture'ı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/fixtures/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFixtures(fixtures.filter((f) => f.id !== id))
      }
    } catch (error) {
      console.error("[v0] Delete fixture error:", error)
    }
  }

  const handleCopy = async (fixture: Fixture) => {
    try {
      const response = await fetch(`/api/fixtures/${fixture.id}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const copiedFixture = await response.json()
        setFixtures([copiedFixture, ...fixtures])
        setEditingFixture(copiedFixture)
        setEditDialogOpen(true)
      }
    } catch (error) {
      console.error("[v0] Copy fixture error:", error)
    }
  }

  const handleShipUpdated = (updatedShip: any) => {
    setCurrentShip(updatedShip)
    setEditShipDialogOpen(false)
    window.location.reload() // Reload to get fresh data
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const filteredFixtures = fixtures.filter((fixture) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      fixture.charterer.toLowerCase().includes(query) ||
      fixture.cargo_type?.toLowerCase().includes(query) ||
      fixture.load_port?.toLowerCase().includes(query) ||
      fixture.discharge_port?.toLowerCase().includes(query)
    const matchesStatus = statusFilter === "all" || fixture.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDragStart = (index: number) => {
    setDraggedTab(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedTab === null || draggedTab === index) return

    const newOrder = [...tabOrder]
    const draggedItem = newOrder[draggedTab]
    newOrder.splice(draggedTab, 1)
    newOrder.splice(index, 0, draggedItem)

    setTabOrder(newOrder)
    setDraggedTab(index)
  }

  const handleDragEnd = () => {
    setDraggedTab(null)
    // Save to localStorage
    localStorage.setItem(`ship-tabs-order-${ship.id}`, JSON.stringify(tabOrder))
  }

  useEffect(() => {
    const saved = localStorage.getItem(`ship-tabs-order-${ship.id}`)
    if (saved) {
      try {
        const parsedOrder = JSON.parse(saved)
        // Filter out any invalid tabs that don't have icons
        const validTabs = parsedOrder.filter((tab: any) => TAB_ICONS[tab.id as keyof typeof TAB_ICONS])
        if (validTabs.length > 0) {
          setTabOrder(validTabs)
        }
      } catch (e) {
        console.error("Failed to load saved tab order")
      }
    }
  }, [ship.id])

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Anchor className="h-6 w-6 text-primary" />
            {currentShip.name}
          </CardTitle>
          <CardDescription className="text-base">
            {currentShip.company_name} - {currentShip.fleet_name}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue={tabOrder[0].id} className="w-full">
        <div className="relative">
          <TabsList
            className="grid w-full gap-1 bg-muted/50 p-1 rounded-lg"
            style={{ gridTemplateColumns: `repeat(${tabOrder.length}, minmax(0, 1fr))` }}
          >
            {tabOrder.map((tab, index) => {
              const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS]
              const IconComponent = Icon || FileText
              const label =
                tab.id === "fixtures"
                  ? `Fixture'lar (${fixtures.length})`
                  : tab.id === "invoices"
                    ? `Faturalar (${invoices.length})`
                    : tab.label
              const shortLabel =
                tab.id === "fixtures"
                  ? `Fix (${fixtures.length})`
                  : tab.id === "invoices"
                    ? `Fat (${invoices.length})`
                    : tab.shortLabel

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="text-xs sm:text-sm cursor-move data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <IconComponent className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{shortLabel}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Sekmeleri sürükleyerek sıralamayı değiştirebilirsiniz
          </p>
        </div>

        <TabsContent value="info" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Dialog open={editShipDialogOpen} onOpenChange={setEditShipDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Edit className="h-4 w-4 mr-2" />
                  Gemi Bilgilerini Düzenle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gemi Bilgilerini Düzenle</DialogTitle>
                </DialogHeader>
                <ShipForm fleetId={currentShip.fleet_id} ship={currentShip} onSuccess={handleShipUpdated} />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ship className="h-5 w-5 text-blue-600" />
                Temel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Gemi Adı</p>
                  <p className="text-lg font-semibold">{currentShip.name}</p>
                </div>
                {currentShip.imo_number && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">IMO Numarası</p>
                    <p className="text-lg">{currentShip.imo_number}</p>
                  </div>
                )}
                {currentShip.vessel_type && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Gemi Tipi</p>
                    <p className="text-lg">{currentShip.vessel_type}</p>
                  </div>
                )}
                {currentShip.flag && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Bayrak</p>
                    <p className="text-lg">{currentShip.flag}</p>
                  </div>
                )}
                {currentShip.built_year && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">İnşa Yılı</p>
                    <p className="text-lg">{currentShip.built_year}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Durum</p>
                  <Badge variant={currentShip.status === "active" ? "default" : "secondary"} className="mt-1">
                    {currentShip.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/20">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5 text-purple-600" />
                Teknik Özellikler
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                {currentShip.dwt && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">DWT (Deadweight Tonnage)</p>
                    <p className="text-lg font-semibold">{currentShip.dwt.toLocaleString()} MT</p>
                  </div>
                )}
                {currentShip.grt && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">GRT (Gross Register Tonnage)</p>
                    <p className="text-lg">{currentShip.grt.toLocaleString()}</p>
                  </div>
                )}
                {currentShip.nrt && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">NRT (Net Register Tonnage)</p>
                    <p className="text-lg">{currentShip.nrt.toLocaleString()}</p>
                  </div>
                )}
                {currentShip.main_engine && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Ana Makine</p>
                    <p className="text-lg">{currentShip.main_engine}</p>
                  </div>
                )}
                {currentShip.engine_power && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Makine Gücü</p>
                    <p className="text-lg">{currentShip.engine_power}</p>
                  </div>
                )}
                {currentShip.speed_laden && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Hız (Yüklü)</p>
                    <p className="text-lg">{currentShip.speed_laden} knots</p>
                  </div>
                )}
                {currentShip.speed_ballast && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Hız (Balast)</p>
                    <p className="text-lg">{currentShip.speed_ballast} knots</p>
                  </div>
                )}
                {currentShip.loa && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">LOA (Uzunluk)</p>
                    <p className="text-lg">{currentShip.loa} m</p>
                  </div>
                )}
                {currentShip.beam && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Genişlik</p>
                    <p className="text-lg">{currentShip.beam} m</p>
                  </div>
                )}
                {currentShip.draft && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Draft (Derinlik)</p>
                    <p className="text-lg">{currentShip.draft} m</p>
                  </div>
                )}
              </div>

              {currentShip.particulars_file_url && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Ship Particulars Dosyası</p>
                  <a
                    href={currentShip.particulars_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Teknik Dökümanı Görüntüle</span>
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {(currentShip.current_position || currentShip.latitude || currentShip.longitude) && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Pozisyon Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {currentShip.current_position && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Mevcut Pozisyon</p>
                      <p className="text-lg">{currentShip.current_position}</p>
                    </div>
                  )}
                  {currentShip.latitude && currentShip.longitude && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Koordinatlar</p>
                      <p className="text-lg">
                        {currentShip.latitude}°, {currentShip.longitude}°
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${currentShip.latitude},${currentShip.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Google Maps'te Görüntüle →
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentShip.consumption_operations && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fuel className="h-5 w-5 text-orange-600" />
                  Yakıt Tüketimi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(() => {
                    // Sabit 10 operasyon; kayıtlı veri bozuk/numaralı olsa bile
                    // isimli ve düzenli gösterilir (0,1,2… kartları oluşmaz).
                    const LABELS: Record<string, string> = {
                      loading: "Yükleme", discharge: "Tahliye", laden: "Yüklü Seyir",
                      ballast: "Boş Seyir", anchor: "Demirde", idle: "Boşta",
                      inerting: "Inerting", washing: "Washing", heating: "Heating",
                      incinerator: "Incinerator",
                    }
                    const ops: any =
                      currentShip.consumption_operations && typeof currentShip.consumption_operations === "object"
                        ? currentShip.consumption_operations
                        : {}
                    return Object.entries(LABELS).map(([key, label]) => {
                      const c = ops[key] && typeof ops[key] === "object" ? ops[key] : {}
                      return (
                        <div key={key} className="p-4 border rounded-lg bg-muted/30">
                          <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">FO:</span> {Number(c.fo) || 0} MT/day
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">MGO:</span> {Number(c.mgo) || 0} MT/day
                            </p>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>

                {currentShip.fuel_consumption_file_url && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Yakıt Tüketim Dökümanı</p>
                    <a
                      href={currentShip.fuel_consumption_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors"
                    >
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Yakıt Tüketim Raporu Görüntüle</span>
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="psc" className="space-y-4">
          <div className="space-y-6">
            <PSCPreparationChecklist shipId={ship.id} />
            <VettingInspections shipId={ship.id} />
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <ShipCertificateList shipId={ship.id} />
        </TabsContent>

        <TabsContent value="fixtures" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Fixture'lar</h3>
              <p className="text-sm text-muted-foreground">Gemiye ait charter anlaşmaları</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Fixture Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yeni Fixture Ekle</DialogTitle>
                </DialogHeader>
                <FixtureForm shipId={ship.id} onSuccess={handleFixtureCreated} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Fixture ara..."
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
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredFixtures.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" ? "Arama sonucu bulunamadı" : "Henüz fixture eklemediniz"}
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Fixture'ınızı Ekleyin
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredFixtures.map((fixture) => (
                <Card key={fixture.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {fixture.charterer}
                        </CardTitle>
                        {fixture.cargo_type && <CardDescription>{fixture.cargo_type}</CardDescription>}
                      </div>
                      <Badge variant={fixture.status === "active" ? "default" : "secondary"}>{fixture.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      {fixture.cp_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CP Tarihi</p>
                          <p>{formatDate(fixture.cp_date)}</p>
                        </div>
                      )}
                      {fixture.rate && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Rate</p>
                          <p>
                            ${fixture.rate.toLocaleString()} {fixture.rate_type || ""}
                          </p>
                        </div>
                      )}
                      {fixture.demurrage_rate && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Demurrage Rate</p>
                          <p>${fixture.demurrage_rate.toLocaleString()}/day</p>
                        </div>
                      )}
                      {fixture.laycan_from && fixture.laycan_to && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Laycan</p>
                          <p>
                            {formatDate(fixture.laycan_from)} - {formatDate(fixture.laycan_to)}
                          </p>
                        </div>
                      )}
                      {fixture.load_port && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Yükleme Limanı</p>
                          <p>{fixture.load_port}</p>
                        </div>
                      )}
                      {fixture.discharge_port && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tahliye Limanı</p>
                          <p>{fixture.discharge_port}</p>
                        </div>
                      )}
                    </div>
                    {fixture.notes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Notlar</p>
                        <p className="text-sm">{fixture.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" asChild>
                        <Link href={`/dashboard/fixtures/${fixture.id}`}>Seferleri Görüntüle</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(fixture)}>
                        Düzenle
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(fixture)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopyala
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(fixture.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gemiye Kesilen Faturalar</CardTitle>
              <CardDescription>Bu gemiye ait tüm faturalar</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <p className="text-muted-foreground">Yükleniyor...</p>
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground">Henüz fatura bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg overflow-hidden">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="block p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.charterer} • {new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {Number(invoice.amount).toLocaleString()} {invoice.currency}
                            </p>
                            <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                              {invoice.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>

                      {invoiceAttachments[invoice.id] && invoiceAttachments[invoice.id].length > 0 && (
                        <div className="px-4 pb-4 pt-2 border-t bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Ekli Dosyalar:</p>
                          <div className="flex flex-wrap gap-2">
                            {invoiceAttachments[invoice.id].map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-background border rounded hover:bg-muted transition-colors"
                              >
                                <FileText className="h-3 w-3" />
                                <span className="max-w-[150px] truncate">{attachment.file_name}</span>
                                <Download className="h-3 w-3 ml-1" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dokümanlar</CardTitle>
              <CardDescription>Gemiye ait sertifikalar ve belgeler</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList shipId={ship.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fixture Düzenle</DialogTitle>
          </DialogHeader>
          {editingFixture && <FixtureForm shipId={ship.id} fixture={editingFixture} onSuccess={handleFixtureUpdated} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
