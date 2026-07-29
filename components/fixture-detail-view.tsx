"use client"

import { useState } from "react"
import { FileText, Plus, Trash2, Ship, MapPin, Info, Copy, Anchor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VoyageForm } from "@/components/voyage-form"
import { Badge } from "@/components/ui/badge"
import { DocumentList } from "@/components/document-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  ship_name: string
  imo_number: string | null
  fleet_name: string
  company_name: string
}

interface Voyage {
  id: string
  fixture_id: string
  voyage_number: string
  status: string
  load_port: string | null
  load_country: string | null
  eta_load: string | null
  etd_load: string | null
  discharge_port: string | null
  discharge_country: string | null
  eta_discharge: string | null
  etd_discharge: string | null
  cargo_quantity: number | null
  cargo_unit: string | null
  demurrage_amount: number | null
  despatch_amount: number | null
  notes: string | null
}

interface FixtureDetailViewProps {
  fixture: Fixture
  initialVoyages: Voyage[]
}

export function FixtureDetailView({ fixture, initialVoyages }: FixtureDetailViewProps) {
  const [voyages, setVoyages] = useState<Voyage[]>(initialVoyages)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingVoyage, setEditingVoyage] = useState<Voyage | null>(null)

  const handleVoyageCreated = (newVoyage: Voyage) => {
    setVoyages([newVoyage, ...voyages])
    setIsDialogOpen(false)
  }

  const handleVoyageUpdated = (updatedVoyage: Voyage) => {
    setVoyages(voyages.map((v) => (v.id === updatedVoyage.id ? updatedVoyage : v)))
    setEditDialogOpen(false)
    setEditingVoyage(null)
  }

  const handleEdit = (voyage: Voyage) => {
    setEditingVoyage(voyage)
    setEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu seferi silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyages/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setVoyages(voyages.filter((v) => v.id !== id))
      }
    } catch (error) {
      console.error("[v0] Delete voyage error:", error)
    }
  }

  const handleCopy = async (voyage: Voyage) => {
    try {
      const response = await fetch(`/api/voyages/${voyage.id}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const copiedVoyage = await response.json()
        setVoyages([copiedVoyage, ...voyages])
        setEditingVoyage(copiedVoyage)
        setEditDialogOpen(true)
      }
    } catch (error) {
      console.error("[v0] Copy voyage error:", error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: "bg-blue-500",
      loading: "bg-yellow-500",
      laden: "bg-orange-500",
      discharging: "bg-purple-500",
      completed: "bg-green-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planned: "Planlandı",
      loading: "Yükleme",
      laden: "Yüklü",
      discharging: "Tahliye",
      completed: "Tamamlandı",
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-100 dark:border-blue-900/30 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
              <Anchor className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-3xl mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {fixture.charterer}
              </CardTitle>
              <CardDescription className="flex items-center gap-3 text-base">
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{fixture.ship_name}</span>
                </div>
                <span className="text-muted-foreground/60">•</span>
                <span>{fixture.company_name}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <Info className="h-4 w-4 mr-2" />
            Bilgiler
          </TabsTrigger>
          <TabsTrigger
            value="voyages"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <Ship className="h-4 w-4 mr-2" />
            Seferler ({voyages.length})
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Dokümanlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="border-blue-100 dark:border-blue-900/30">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Anchor className="h-5 w-5 text-blue-600" />
                Fixture Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                {fixture.cargo_type && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kargo Tipi</p>
                    <p className="text-lg">{fixture.cargo_type}</p>
                  </div>
                )}
                {fixture.rate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rate</p>
                    <p className="text-lg">
                      ${fixture.rate.toLocaleString()} {fixture.rate_type || ""}
                    </p>
                  </div>
                )}
                {fixture.demurrage_rate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Demurrage Rate</p>
                    <p className="text-lg">${fixture.demurrage_rate.toLocaleString()}/day</p>
                  </div>
                )}
                {fixture.cp_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CP Tarihi</p>
                    <p className="text-lg">{formatDate(fixture.cp_date)}</p>
                  </div>
                )}
                {fixture.laycan_from && fixture.laycan_to && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Laycan</p>
                    <p className="text-lg">
                      {formatDate(fixture.laycan_from)} - {formatDate(fixture.laycan_to)}
                    </p>
                  </div>
                )}
                {fixture.load_port && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Yükleme Limanı</p>
                    <p className="text-lg">{fixture.load_port}</p>
                  </div>
                )}
                {fixture.discharge_port && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tahliye Limanı</p>
                    <p className="text-lg">{fixture.discharge_port}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durum</p>
                  <Badge variant={fixture.status === "active" ? "default" : "secondary"} className="mt-1">
                    {fixture.status}
                  </Badge>
                </div>
              </div>
              {fixture.notes && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notlar</p>
                  <p className="text-sm">{fixture.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voyages" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Seferler</h3>
              <p className="text-sm text-muted-foreground">Fixture'a ait sefer detayları</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Sefer Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yeni Sefer Ekle</DialogTitle>
                </DialogHeader>
                <VoyageForm fixtureId={fixture.id} onSuccess={handleVoyageCreated} />
              </DialogContent>
            </Dialog>
          </div>

          {voyages.length === 0 ? (
            <Card className="border-blue-100 dark:border-blue-900/30 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ship className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Henüz sefer eklemediniz</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Seferinizi Ekleyin
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {voyages.map((voyage) => (
                <Card
                  key={voyage.id}
                  className="hover:shadow-lg transition-shadow border-blue-100 dark:border-blue-900/30 shadow-lg"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <Ship className="h-5 w-5" />
                          {voyage.voyage_number}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 text-base">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{voyage.load_port}</span>
                          </div>
                          <span className="text-muted-foreground/60">→</span>
                          <span>{voyage.discharge_port}</span>
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(voyage.status)}>{getStatusLabel(voyage.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Yükleme</p>
                            <p className="text-sm text-muted-foreground">
                              {voyage.load_port}
                              {voyage.load_country && `, ${voyage.load_country}`}
                            </p>
                            {voyage.eta_load && (
                              <p className="text-xs text-muted-foreground">ETA: {formatDate(voyage.eta_load)}</p>
                            )}
                            {voyage.etd_load && (
                              <p className="text-xs text-muted-foreground">ETD: {formatDate(voyage.etd_load)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Tahliye</p>
                            <p className="text-sm text-muted-foreground">
                              {voyage.discharge_port}
                              {voyage.discharge_country && `, ${voyage.discharge_country}`}
                            </p>
                            {voyage.eta_discharge && (
                              <p className="text-xs text-muted-foreground">ETA: {formatDate(voyage.eta_discharge)}</p>
                            )}
                            {voyage.etd_discharge && (
                              <p className="text-xs text-muted-foreground">ETD: {formatDate(voyage.etd_discharge)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {voyage.cargo_quantity && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm">
                          <span className="font-medium">Kargo:</span> {voyage.cargo_quantity.toLocaleString()}{" "}
                          {voyage.cargo_unit}
                        </p>
                      </div>
                    )}

                    {(voyage.demurrage_amount || voyage.despatch_amount) && (
                      <div className="mt-2 flex gap-4 text-sm">
                        {voyage.demurrage_amount && (
                          <p>
                            <span className="font-medium">Demurrage:</span> ${voyage.demurrage_amount.toLocaleString()}
                          </p>
                        )}
                        {voyage.despatch_amount && (
                          <p>
                            <span className="font-medium">Despatch:</span> ${voyage.despatch_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {voyage.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{voyage.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(voyage)}>
                        Düzenle
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(voyage)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopyala
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(voyage.id)}>
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

        <TabsContent value="documents" className="space-y-4">
          <Card className="border-blue-100 dark:border-blue-900/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
                Dokümanlar
              </CardTitle>
              <CardDescription className="flex items-center gap-3 text-base">
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{fixture.ship_name}</span>
                </div>
                <span className="text-muted-foreground/60">•</span>
                <span>{fixture.company_name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <DocumentList fixtureId={fixture.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sefer Düzenle</DialogTitle>
          </DialogHeader>
          {editingVoyage && (
            <VoyageForm fixtureId={fixture.id} voyage={editingVoyage} onSuccess={handleVoyageUpdated} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
