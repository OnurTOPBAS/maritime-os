"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VoyageForm } from "@/components/voyage-form"
import { DataLabel } from "@/components/data-label"
import { VoyageFuelTab } from "@/components/voyage-fuel-tab"
import { VoyageDocumentsTab } from "@/components/voyage-documents-tab"
import { Ship, Calendar, FileText, Pencil, ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToastNotification } from "@/components/toast-provider"

interface VoyageDetailViewProps {
  voyage: any
}

export function VoyageDetailView({ voyage }: VoyageDetailViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const toast = useToastNotification()

  const handleSuccess = () => {
    setDialogOpen(false)
    toast.success("Sefer güncellendi", "Sefer başarıyla güncellendi")
    router.refresh()
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  const loadingPorts = Array.isArray(voyage.loading_ports) ? voyage.loading_ports : []
  const dischargePorts = Array.isArray(voyage.discharge_ports) ? voyage.discharge_ports : []

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0 bg-transparent">
            <Link href="/dashboard/voyages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">{voyage.voyage_number}</h1>
              {getStatusBadge(voyage.status)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ship className="h-4 w-4" />
              <span className="font-medium text-foreground">{voyage.ship_name}</span>
              <span>•</span>
              <span>{voyage.charterer}</span>
            </div>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md">
              <Pencil className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Sefer Düzenle</DialogTitle>
            </DialogHeader>
            <VoyageForm fixtureId={voyage.fixture_id} voyage={voyage} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger
            value="ports"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Limanlar
          </TabsTrigger>
          <TabsTrigger
            value="cargo"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Kargo & Laytime
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Finansal
          </TabsTrigger>
          <TabsTrigger
            value="fuel"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Yakıt
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Dökümanlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Ship className="h-5 w-5" />
                </div>
                Gemi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
              <DataLabel label="Gemi Adı" value={voyage.ship_name} />
              <DataLabel label="IMO Numarası" value={voyage.imo_number || "-"} />
              <DataLabel label="Filo" value={voyage.fleet_name} />
              <DataLabel label="Charterer" value={voyage.charterer} />
              <DataLabel label="Şirket" value={voyage.company_name} />
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                Tarihler
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
              <DataLabel label="Laycan Başlangıç" value={formatDate(voyage.laycan_from)} />
              <DataLabel label="Laycan Bitiş" value={formatDate(voyage.laycan_to)} />
              <DataLabel label="Sefer Başlangıç" value={formatDate(voyage.start_date)} />
              <DataLabel label="Sefer Bitiş" value={formatDate(voyage.end_date)} />
            </CardContent>
          </Card>

          {voyage.notes && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  Notlar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{voyage.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Yükleme Limanları
              </CardTitle>
              <CardDescription>{loadingPorts.length} liman</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPorts.length > 0 ? (
                <div className="space-y-4">
                  {loadingPorts.map((port: any, index: number) => (
                    <Card key={index} className="border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{port.port_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DataLabel
                          label="Kargo Miktarı"
                          value={port.cargo_quantity ? `${port.cargo_quantity} ${port.cargo_unit || ""}` : "-"}
                        />
                        <DataLabel label="ATA" value={formatDate(port.ata)} />
                        <DataLabel label="ATB" value={formatDate(port.atb)} />
                        <DataLabel label="ATC" value={formatDate(port.atc)} />
                        <DataLabel label="ATD" value={formatDate(port.atd)} />
                        {port.bunker_supply && (
                          <>
                            <DataLabel label="Bunker FO" value={port.bunker_fo ? `${port.bunker_fo} MT` : "-"} />
                            <DataLabel label="Bunker MGO" value={port.bunker_mgo ? `${port.bunker_mgo} MT` : "-"} />
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Yükleme limanı bilgisi yok</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Tahliye Limanları
              </CardTitle>
              <CardDescription>{dischargePorts.length} liman</CardDescription>
            </CardHeader>
            <CardContent>
              {dischargePorts.length > 0 ? (
                <div className="space-y-4">
                  {dischargePorts.map((port: any, index: number) => (
                    <Card key={index} className="border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{port.port_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DataLabel
                          label="Kargo Miktarı"
                          value={port.cargo_quantity ? `${port.cargo_quantity} ${port.cargo_unit || ""}` : "-"}
                        />
                        <DataLabel label="ATA" value={formatDate(port.ata)} />
                        <DataLabel label="ATB" value={formatDate(port.atb)} />
                        <DataLabel label="ATC" value={formatDate(port.atc)} />
                        <DataLabel label="ATD" value={formatDate(port.atd)} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tahliye limanı bilgisi yok</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cargo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kargo Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <DataLabel
                label="Kargo Miktarı"
                value={voyage.cargo_quantity ? `${voyage.cargo_quantity} ${voyage.cargo_unit || ""}` : "-"}
              />
              <DataLabel label="Kargo Birimi" value={voyage.cargo_unit || "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Laytime Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-4">Yükleme</h4>
                <div className="grid grid-cols-2 gap-6">
                  <DataLabel
                    label="İzin Verilen Laytime"
                    value={voyage.laytime_allowed_load ? `${voyage.laytime_allowed_load} saat` : "-"}
                  />
                  <DataLabel
                    label="Kullanılan Laytime"
                    value={voyage.laytime_used_load ? `${voyage.laytime_used_load} saat` : "-"}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-4">Tahliye</h4>
                <div className="grid grid-cols-2 gap-6">
                  <DataLabel
                    label="İzin Verilen Laytime"
                    value={voyage.laytime_allowed_discharge ? `${voyage.laytime_allowed_discharge} saat` : "-"}
                  />
                  <DataLabel
                    label="Kullanılan Laytime"
                    value={voyage.laytime_used_discharge ? `${voyage.laytime_used_discharge} saat` : "-"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Finansal Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <DataLabel
                label="Navlun Oranı"
                value={voyage.freight_rate ? `${voyage.freight_rate} ${voyage.freight_rate_type || ""}` : "-"}
              />
              <DataLabel
                label="Demurrage"
                value={voyage.demurrage_amount ? `$${Number(voyage.demurrage_amount).toLocaleString()}` : "-"}
              />
              <DataLabel
                label="Despatch"
                value={voyage.despatch_amount ? `$${Number(voyage.despatch_amount).toLocaleString()}` : "-"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          <VoyageFuelTab voyageId={voyage.id} />
        </TabsContent>

        <TabsContent value="documents">
          <VoyageDocumentsTab voyageId={voyage.id} loadingPorts={loadingPorts} dischargePorts={dischargePorts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
