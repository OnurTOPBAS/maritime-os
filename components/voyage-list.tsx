"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VoyageForm } from "@/components/voyage-form"
import { Plus, Ship, Pencil, Trash2, ExternalLink, Copy, Search, Calendar, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { Input } from "@/components/ui/input"
import { useVoyages } from "@/lib/hooks/use-data-fetching"
import { useToastNotification } from "@/components/toast-provider"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { ErrorBoundary } from "@/components/error-boundary"
import { VoyageCardSettingsComponent, type VoyageCardSettings } from "@/components/voyage-card-settings"

export function VoyageList() {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [selectedFixture, setSelectedFixture] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const {
    data: voyages = [],
    isLoading: loading,
    error,
    refresh,
  } = useVoyages({
    shipId: selectedFixture,
    status: filterStatus,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVoyage, setEditingVoyage] = useState<any>(null)
  const [cardSettings, setCardSettings] = useState<VoyageCardSettings>({
    showLoadingPorts: true,
    showDischargePorts: true,
    showStartDate: true,
    showEndDate: true,
    showCharterer: true,
    showStatus: true,
    viewMode: "detailed",
  })

  const toast = useToastNotification()

  useEffect(() => {
    fetchFixtures()
  }, [])

  const fetchFixtures = async () => {
    try {
      const response = await fetch("/api/fixtures")
      if (response.ok) {
        const data = await response.json()
        setFixtures(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching fixtures:", error)
      setFixtures([])
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu seferi silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyages/${id}`, { method: "DELETE" })
      if (response.ok) {
        refresh()
        toast.success("Sefer silindi", "Sefer başarıyla silindi")
      }
    } catch (error) {
      console.error("Error deleting voyage:", error)
      toast.error("Silme başarısız", "Sefer silinirken bir hata oluştu")
    }
  }

  const handleEdit = (voyage: any) => {
    setEditingVoyage(voyage)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingVoyage(null)
    refresh()
    toast.success(
      editingVoyage ? "Sefer güncellendi" : "Sefer oluşturuldu",
      editingVoyage ? "Sefer başarıyla güncellendi" : "Yeni sefer başarıyla oluşturuldu",
    )
  }

  const handleCopy = async (voyage: any) => {
    try {
      const response = await fetch(`/api/voyages/${voyage.id}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const copiedVoyage = await response.json()
        refresh()
        setEditingVoyage(copiedVoyage)
        setDialogOpen(true)
        toast.success("Sefer kopyalandı", "Sefer başarıyla kopyalandı")
      }
    } catch (error) {
      console.error("[v0] Copy voyage error:", error)
      toast.error("Kopyalama başarısız", "Sefer kopyalanırken bir hata oluştu")
    }
  }

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

  const filteredVoyages = voyages.filter((voyage) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      voyage.voyage_number?.toLowerCase().includes(query) ||
      voyage.ship_name?.toLowerCase().includes(query) ||
      voyage.charterer?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return <SkeletonList items={3} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Seferler yüklenirken bir hata oluştu</p>
          <Button onClick={refresh} variant="outline" className="mt-4 bg-transparent">
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sefer Yönetimi</h2>
            <p className="text-muted-foreground mt-2">
              Toplam <span className="font-semibold text-foreground">{filteredVoyages.length}</span> sefer
              {searchQuery && ` (${voyages.length} içinden)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <VoyageCardSettingsComponent onSettingsChange={setCardSettings} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setEditingVoyage(null)}
                  size="lg"
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Yeni Sefer Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{editingVoyage ? "Sefer Düzenle" : "Yeni Sefer Ekle"}</DialogTitle>
                </DialogHeader>
                {selectedFixture !== "all" || editingVoyage ? (
                  <VoyageForm
                    fixtureId={editingVoyage?.fixture_id || selectedFixture}
                    voyage={editingVoyage}
                    onSuccess={handleSuccess}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Lütfen önce bir fixture seçin</p>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Sefer numarası, gemi veya charterer ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedFixture} onValueChange={setSelectedFixture}>
                  <SelectTrigger className="w-[220px] h-11">
                    <SelectValue placeholder="Tüm Fixture'lar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Fixture'lar</SelectItem>
                    {fixtures.map((fixture) => (
                      <SelectItem key={fixture.id} value={fixture.id}>
                        {fixture.ship_name} - {fixture.charterer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px] h-11">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="planned">Planlandı</SelectItem>
                    <SelectItem value="ongoing">Devam Ediyor</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredVoyages.length === 0 ? (
          <EmptyState
            icon={Ship}
            title={
              searchQuery || selectedFixture !== "all" || filterStatus !== "all"
                ? "Sonuç bulunamadı"
                : "Henüz sefer bulunmuyor"
            }
            description={
              searchQuery || selectedFixture !== "all" || filterStatus !== "all"
                ? "Farklı filtreler veya arama terimleri deneyin"
                : "İlk seferinizi ekleyerek başlayın"
            }
            action={
              !searchQuery && selectedFixture === "all" && filterStatus === "all"
                ? {
                    label: "İlk Seferi Ekle",
                    onClick: () => setDialogOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredVoyages.map((voyage) => (
              <Card
                key={voyage.id}
                className={`group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden ${
                  cardSettings.viewMode === "compact" ? "hover:shadow-md" : ""
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50" />
                <CardHeader className={`${cardSettings.viewMode === "compact" ? "pb-3" : "pb-4"} pl-6`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 flex items-start gap-4">
                      <div
                        className={`${
                          cardSettings.viewMode === "compact" ? "p-2" : "p-3"
                        } rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors`}
                      >
                        <Ship className={cardSettings.viewMode === "compact" ? "h-5 w-5" : "h-6 w-6"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className={cardSettings.viewMode === "compact" ? "text-lg" : "text-xl"}>
                            <Link
                              href={`/dashboard/voyages/${voyage.id}`}
                              className="hover:text-primary transition-colors flex items-center gap-2 group/link"
                            >
                              {voyage.voyage_number}
                              <ExternalLink className="h-4 w-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                          </CardTitle>
                          {cardSettings.showStatus && getStatusBadge(voyage.status)}
                        </div>
                        <CardDescription
                          className={`flex items-center gap-2 ${cardSettings.viewMode === "compact" ? "text-sm" : "text-base"}`}
                        >
                          <Ship className="h-4 w-4" />
                          <span className="font-medium text-foreground">{voyage.ship_name}</span>
                          {cardSettings.showCharterer && (
                            <>
                              <span className="text-muted-foreground/60">•</span>
                              <span>{voyage.charterer}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(voyage)}
                        className="h-9 w-9 hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(voyage)}
                        className="h-9 w-9 hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(voyage.id)}
                        className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={`space-y-4 pl-6 ${cardSettings.viewMode === "compact" ? "pb-3" : ""}`}>
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 ${cardSettings.viewMode === "compact" ? "lg:grid-cols-4 gap-3" : "lg:grid-cols-4 gap-4"}`}
                  >
                    {cardSettings.showLoadingPorts && voyage.loading_ports && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                        <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-green-900 dark:text-green-100 uppercase tracking-wide mb-1">
                            Yükleme Limanları
                          </p>
                          <p className="text-sm font-semibold text-green-700 dark:text-green-300 truncate">
                            {Array.isArray(voyage.loading_ports)
                              ? voyage.loading_ports.map((p: any) => p.port_name).join(", ")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    )}
                    {cardSettings.showDischargePorts && voyage.discharge_ports && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                        <MapPin className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-red-900 dark:text-red-100 uppercase tracking-wide mb-1">
                            Tahliye Limanları
                          </p>
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300 truncate">
                            {Array.isArray(voyage.discharge_ports)
                              ? voyage.discharge_ports.map((p: any) => p.port_name).join(", ")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    )}
                    {cardSettings.showStartDate && voyage.start_date && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-1">
                            Başlangıç
                          </p>
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {formatDate(voyage.start_date)}
                          </p>
                        </div>
                      </div>
                    )}
                    {cardSettings.showEndDate && voyage.end_date && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-purple-900 dark:text-purple-100 uppercase tracking-wide mb-1">
                            Bitiş
                          </p>
                          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            {formatDate(voyage.end_date)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {cardSettings.viewMode === "detailed" && voyage.notes && (
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notlar</p>
                      <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">{voyage.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
