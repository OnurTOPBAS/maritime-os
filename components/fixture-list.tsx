"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FixtureForm } from "@/components/fixture-form"
import { Plus, Anchor, Pencil, Trash2, ExternalLink, Copy, Filter, Ship, Waves } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { DataLabel } from "@/components/data-label"
import { Input } from "@/components/ui/input"
import { useFixtures } from "@/lib/hooks/use-data-fetching"
import { useToastNotification } from "@/components/toast-provider"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { ErrorBoundary } from "@/components/error-boundary"
import { FixtureCardSettingsComponent, type FixtureCardSettings } from "@/components/fixture-card-settings"

export function FixtureList() {
  const [ships, setShips] = useState<any[]>([])
  const [selectedShip, setSelectedShip] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFixture, setEditingFixture] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards")
  const [cardSettings, setCardSettings] = useState<FixtureCardSettings>({
    showFixtureType: true,
    showCargoType: true,
    showRate: true,
    showCpDate: true,
    showLaycan: true,
    showPorts: true,
    viewMode: "detailed",
  })

  const {
    data: fixtures = [],
    isLoading: loading,
    error,
    refresh,
  } = useFixtures({
    shipId: selectedShip,
    status: filterStatus,
  })

  const toast = useToastNotification()

  useEffect(() => {
    fetchShips()
  }, [])

  const fetchShips = async () => {
    try {
      const response = await fetch("/api/ships")
      if (response.ok) {
        const data = await response.json()
        setShips(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching ships:", error)
      setShips([])
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu fixture'ı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/fixtures/${id}`, { method: "DELETE" })
      if (response.ok) {
        refresh()
        toast.success("Fixture silindi", "Fixture başarıyla silindi")
      }
    } catch (error) {
      console.error("Error deleting fixture:", error)
      toast.error("Silme başarısız", "Fixture silinirken bir hata oluştu")
    }
  }

  const handleEdit = (fixture: any) => {
    setEditingFixture(fixture)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingFixture(null)
    refresh()
    toast.success(
      editingFixture ? "Fixture güncellendi" : "Fixture oluşturuldu",
      editingFixture ? "Fixture başarıyla güncellendi" : "Yeni fixture başarıyla oluşturuldu",
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getStatusBadge = (status: string) => {
    const config = {
      fixed: { variant: "success" as const, label: "Fixed" },
      subs: { variant: "warning" as const, label: "Subs" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    }
    const statusConfig = config[status as keyof typeof config] || { variant: "outline" as const, label: status }
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
  }

  const handleCopy = async (fixture: any) => {
    try {
      const response = await fetch(`/api/fixtures/${fixture.id}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const copiedFixture = await response.json()
        refresh()
        setEditingFixture(copiedFixture)
        setDialogOpen(true)
        toast.success("Fixture kopyalandı", "Fixture başarıyla kopyalandı")
      } else {
        console.error("[v0] Copy fixture failed:", await response.text())
        toast.error("Kopyalama başarısız", "Fixture kopyalanırken bir hata oluştu")
      }
    } catch (error) {
      console.error("[v0] Copy fixture error:", error)
      toast.error("Kopyalama başarısız", "Fixture kopyalanırken bir hata oluştu")
    }
  }

  const filteredFixtures = fixtures.filter((fixture) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      fixture.charterer?.toLowerCase().includes(query) ||
      fixture.ship_name?.toLowerCase().includes(query) ||
      fixture.cargo_type?.toLowerCase().includes(query) ||
      fixture.load_port?.toLowerCase().includes(query) ||
      fixture.discharge_port?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return <SkeletonList items={4} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Fixture'lar yüklenirken bir hata oluştu</p>
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
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                <Anchor className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Fixture Yönetimi
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Toplam {filteredFixtures.length} fixture {searchQuery && `(${fixtures.length} içinden)`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FixtureCardSettingsComponent onSettingsChange={setCardSettings} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setEditingFixture(null)}
                  size="default"
                  className="shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Fixture
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Anchor className="h-5 w-5 text-blue-600" />
                    {editingFixture ? "Fixture Düzenle" : "Yeni Fixture"}
                  </DialogTitle>
                </DialogHeader>
                {selectedShip !== "all" || editingFixture ? (
                  <FixtureForm
                    shipId={editingFixture?.ship_id || selectedShip}
                    fixture={editingFixture}
                    onSuccess={handleSuccess}
                  />
                ) : (
                  <p className="text-muted-foreground">Lütfen önce bir gemi seçin</p>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-blue-100 dark:border-blue-900/30 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Input
                  placeholder="Charterer, gemi, kargo veya liman ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600"
                />
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              </div>
              <div className="flex gap-2">
                <Select value={selectedShip} onValueChange={setSelectedShip}>
                  <SelectTrigger className="w-[180px] border-blue-200 dark:border-blue-900/50">
                    <Ship className="h-4 w-4 mr-2 text-blue-600" />
                    <SelectValue placeholder="Tüm Gemiler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Gemiler</SelectItem>
                    {ships.map((ship) => (
                      <SelectItem key={ship.id} value={ship.id}>
                        {ship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] border-blue-200 dark:border-blue-900/50">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="subs">Subs</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredFixtures.length === 0 ? (
          <EmptyState
            icon={Anchor}
            title={
              searchQuery || selectedShip !== "all" || filterStatus !== "all"
                ? "Sonuç bulunamadı"
                : "Henüz fixture bulunmuyor"
            }
            description={
              searchQuery || selectedShip !== "all" || filterStatus !== "all"
                ? "Farklı filtreler veya arama terimleri deneyin"
                : "İlk fixture'ınızı ekleyerek başlayın"
            }
            action={
              !searchQuery && selectedShip === "all" && filterStatus === "all"
                ? {
                    label: "İlk Fixture'ı Ekle",
                    onClick: () => setDialogOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredFixtures.map((fixture) => (
              <Card
                key={fixture.id}
                className={`group hover:shadow-xl transition-all duration-300 border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/50 ${
                  cardSettings.viewMode === "compact" ? "hover:shadow-md" : ""
                }`}
              >
                <CardHeader className={cardSettings.viewMode === "compact" ? "pb-3" : "pb-4"}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`${
                            cardSettings.viewMode === "compact" ? "p-2" : "p-2.5"
                          } rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md group-hover:shadow-lg transition-shadow`}
                        >
                          <Anchor className={cardSettings.viewMode === "compact" ? "h-4 w-4" : "h-5 w-5"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle
                            className={`${cardSettings.viewMode === "compact" ? "text-base" : "text-lg"} flex items-center gap-2 mb-1`}
                          >
                            <Link
                              href={`/dashboard/fixtures/${fixture.id}`}
                              className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                            >
                              {fixture.charterer}
                            </Link>
                            <ExternalLink className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                          </CardTitle>
                          <CardDescription
                            className={`flex items-center gap-2 ${cardSettings.viewMode === "compact" ? "text-xs" : "text-sm"}`}
                          >
                            <Ship className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-medium">{fixture.ship_name}</span>
                            <span className="text-muted-foreground/60">•</span>
                            <span>{fixture.company_name}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(fixture.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(fixture)}
                        className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(fixture)}
                        className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(fixture.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${cardSettings.viewMode === "compact" ? "pb-2" : "pb-4"} border-b border-blue-100 dark:border-blue-900/30`}
                  >
                    {cardSettings.showFixtureType && fixture.fixture_type && (
                      <DataLabel label="Tip" value={fixture.fixture_type} />
                    )}
                    {cardSettings.showCargoType && fixture.cargo_type && (
                      <DataLabel label="Kargo" value={fixture.cargo_type} />
                    )}
                    {cardSettings.showRate && fixture.rate && (
                      <DataLabel
                        label="Navlun"
                        value={`$${Number(fixture.rate).toLocaleString()} ${fixture.rate_type || ""}`}
                      />
                    )}
                    {cardSettings.showCpDate && fixture.cp_date && (
                      <DataLabel label="CP Tarihi" value={formatDate(fixture.cp_date)} />
                    )}
                  </div>

                  {(cardSettings.showLaycan || cardSettings.showPorts) &&
                    (fixture.laycan_from || fixture.laycan_to || fixture.load_port || fixture.discharge_port) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cardSettings.showLaycan && (fixture.laycan_from || fixture.laycan_to) && (
                          <DataLabel
                            label="Laycan"
                            value={`${formatDate(fixture.laycan_from)} - ${formatDate(fixture.laycan_to)}`}
                          />
                        )}
                        {cardSettings.showPorts && fixture.load_port && (
                          <div className="flex items-start gap-2">
                            <Waves className="h-4 w-4 mt-1 text-blue-500" />
                            <DataLabel label="Yükleme Limanı" value={fixture.load_port} />
                          </div>
                        )}
                        {cardSettings.showPorts && fixture.discharge_port && (
                          <div className="flex items-start gap-2">
                            <Waves className="h-4 w-4 mt-1 text-cyan-500" />
                            <DataLabel label="Tahliye Limanı" value={fixture.discharge_port} />
                          </div>
                        )}
                      </div>
                    )}

                  {cardSettings.viewMode === "detailed" && fixture.notes && (
                    <div className="pt-3 border-t border-blue-100 dark:border-blue-900/30">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                        Notlar
                      </p>
                      <p className="text-sm text-foreground/80 line-clamp-2">{fixture.notes}</p>
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
