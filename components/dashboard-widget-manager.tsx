"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2, GripVertical, RotateCcw, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WidgetPosition {
  area: string
  order: number
}

interface DashboardWidgetManagerProps {
  layoutType: string
  customLayout?: {
    id: string
    name: string
    areas: Array<{ id: string; width: string; order: number }>
  } | null
  visibleWidgets: string[]
  widgetPositions: Record<string, WidgetPosition>
  onSave: (data: { visibleWidgets: string[]; widgetPositions: Record<string, WidgetPosition> }) => void
}

const AVAILABLE_WIDGETS = [
  { id: "stats", label: "İstatistikler", description: "Genel sistem istatistikleri" },
  { id: "all-ships", label: "Tüm Gemiler", description: "Filonuzdaki tüm gemilere hızlı erişim" },
  { id: "activity", label: "Son Aktiviteler", description: "Son fixture ve sefer hareketleri" },
  { id: "financial", label: "Finansal Özet", description: "Gelir, gider ve kar/zarar özeti" },
  { id: "companies", label: "Şirketlerim", description: "Şirket listesi" },
  { id: "quick-actions", label: "Hızlı İşlemler", description: "Sık kullanılan işlemler" },
  { id: "calendar", label: "Takvim Özeti", description: "Yaklaşan etkinlikler" },
  { id: "upcoming-laycans", label: "Yaklaşan Laycan'lar", description: "30 gün içinde başlayacak fixture'lar" },
  { id: "active-voyages", label: "Aktif Seferler", description: "Devam eden seferler" },
  { id: "pending-actions", label: "Bekleyen İşlemler", description: "Dikkat gerektiren konular" },
  { id: "recent-documents", label: "Son Belgeler", description: "En son yüklenen dokümanlar" },
  { id: "fleet-performance", label: "Filo Performansı", description: "Filo kullanım oranı ve ortalama sefer süresi" },
  { id: "fuel-cost", label: "Yakıt Maliyetleri", description: "Toplam yakıt tüketimi ve maliyetler" },
  { id: "port-statistics", label: "Liman İstatistikleri", description: "En çok ziyaret edilen limanlar" },
  { id: "weather", label: "Hava Durumu", description: "Gemi bölgelerindeki hava ve deniz durumu" },
  { id: "market-prices", label: "Piyasa Fiyatları", description: "Baltic Dry Index, yakıt fiyatları ve döviz kurları" },
  {
    id: "performance-comparison",
    label: "Performans Karşılaştırma",
    description: "Gemi bazında performans ve verimlilik analizi",
  },
  { id: "financial-forecast", label: "Finansal Tahmin", description: "6 aylık gelir ve gider projeksiyonu" },
  { id: "compliance", label: "Uyum ve Regülasyon", description: "IMO düzenlemeleri ve çevre uyumu" },
  {
    id: "expiring-certificates",
    label: "Süresi Yaklaşan Sertifikalar",
    description: "90 gün içinde süresi dolacak gemi sertifikaları",
  },
]

function getAvailableAreasForLayout(
  layout: string,
  custom?: { id: string; name: string; areas: Array<{ id: string; width: string; order: number }> } | null,
) {
  if (custom && custom.areas) {
    return custom.areas.map((area, index) => ({
      value: area.id,
      label: `Alan ${index + 1}`,
    }))
  }

  switch (layout) {
    case "sidebar-left":
    case "sidebar-right":
      return [
        { value: "sidebar", label: "Kenar Çubuğu" },
        { value: "main", label: "Ana Alan" },
      ]
    case "grid-2col":
    case "grid-3col":
    case "masonry":
    default:
      return [{ value: "main", label: "Ana Alan" }]
  }
}

export function DashboardWidgetManager({
  layoutType,
  customLayout,
  visibleWidgets,
  widgetPositions,
  onSave,
}: DashboardWidgetManagerProps) {
  const [open, setOpen] = useState(false)
  const [localVisible, setLocalVisible] = useState(visibleWidgets)
  const [localPositions, setLocalPositions] = useState(() => {
    const positions = { ...widgetPositions }
    const areas = getAvailableAreasForLayout(layoutType, customLayout)
    const defaultArea = areas[0]?.value || "main"

    // Add default positions for visible widgets that don't have positions
    visibleWidgets.forEach((widgetId, index) => {
      if (!positions[widgetId]) {
        positions[widgetId] = { area: defaultArea, order: index }
      }
    })

    return positions
  })

  const getAvailableAreas = () => {
    return getAvailableAreasForLayout(layoutType, customLayout)
  }

  const availableAreas = getAvailableAreas()
  const availableAreaValues = availableAreas.map((a) => a.value)

  // Check if any widgets are assigned to non-existent areas
  const hasInvalidAssignments = localVisible.some((widgetId) => {
    const position = localPositions[widgetId]
    return position && !availableAreaValues.includes(position.area)
  })

  const handleResetAllPositions = () => {
    const defaultArea = availableAreas[0]?.value || "main"
    const newPositions: Record<string, WidgetPosition> = {}

    localVisible.forEach((widgetId, index) => {
      newPositions[widgetId] = { area: defaultArea, order: index }
    })

    setLocalPositions(newPositions)
  }

  useEffect(() => {
    if (open && hasInvalidAssignments) {
      const defaultArea = availableAreas[0]?.value || "main"
      const newPositions = { ...localPositions }
      let changed = false

      localVisible.forEach((widgetId) => {
        const position = newPositions[widgetId]
        if (position && !availableAreaValues.includes(position.area)) {
          newPositions[widgetId] = { area: defaultArea, order: position.order }
          changed = true
        }
      })

      if (changed) {
        setLocalPositions(newPositions)
      }
    }
  }, [open])

  const handleToggleWidget = (widgetId: string) => {
    setLocalVisible((prev) => {
      if (prev.includes(widgetId)) {
        return prev.filter((id) => id !== widgetId)
      } else {
        // Add widget with default position
        if (!localPositions[widgetId]) {
          const areas = getAvailableAreas()
          const defaultArea = areas[0]?.value || "main"
          setLocalPositions((pos) => ({
            ...pos,
            [widgetId]: { area: defaultArea, order: Object.keys(pos).length },
          }))
        }
        return [...prev, widgetId]
      }
    })
  }

  const handleAreaChange = (widgetId: string, area: string) => {
    setLocalPositions((prev) => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], area },
    }))
  }

  const handleMoveUp = (widgetId: string) => {
    const currentPos = localPositions[widgetId]
    if (!currentPos) return

    const currentArea = currentPos.area
    const currentOrder = currentPos.order

    // Find widgets in the same area
    const sameAreaWidgets = Object.entries(localPositions)
      .filter(([_, pos]) => pos.area === currentArea)
      .sort((a, b) => a[1].order - b[1].order)

    const currentIndex = sameAreaWidgets.findIndex(([id]) => id === widgetId)
    if (currentIndex === 0) return

    const newPositions = { ...localPositions }
    const [prevWidgetId] = sameAreaWidgets[currentIndex - 1]

    const prevOrder = localPositions[prevWidgetId].order
    const currentWidgetOrder = localPositions[widgetId].order

    // Swap orders
    newPositions[prevWidgetId] = { ...newPositions[prevWidgetId], order: currentWidgetOrder }
    newPositions[widgetId] = { ...newPositions[widgetId], order: prevOrder }

    setLocalPositions(newPositions)
  }

  const handleMoveDown = (widgetId: string) => {
    const currentPos = localPositions[widgetId]
    if (!currentPos) return

    const currentArea = currentPos.area
    const currentOrder = currentPos.order

    // Find widgets in the same area
    const sameAreaWidgets = Object.entries(localPositions)
      .filter(([_, pos]) => pos.area === currentArea)
      .sort((a, b) => a[1].order - b[1].order)

    const currentIndex = sameAreaWidgets.findIndex(([id]) => id === widgetId)
    if (currentIndex === sameAreaWidgets.length - 1) return

    const newPositions = { ...localPositions }
    const [nextWidgetId] = sameAreaWidgets[currentIndex + 1]

    const nextOrder = localPositions[nextWidgetId].order
    const currentWidgetOrder = localPositions[widgetId].order

    // Swap orders
    newPositions[nextWidgetId] = { ...newPositions[nextWidgetId], order: currentWidgetOrder }
    newPositions[widgetId] = { ...newPositions[widgetId], order: nextOrder }

    setLocalPositions(newPositions)
  }

  const handleSave = () => {
    onSave({ visibleWidgets: localVisible, widgetPositions: localPositions })
    setOpen(false)
  }

  const areas = getAvailableAreas()
  const widgetsByArea = areas.map((area) => ({
    area,
    widgets: localVisible
      .filter((widgetId) => localPositions[widgetId]?.area === area.value)
      .sort((a, b) => {
        const orderA = localPositions[a]?.order || 0
        const orderB = localPositions[b]?.order || 0
        return orderA - orderB
      }),
  }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Widget Yönet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Widget Yönetimi</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {hasInvalidAssignments && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bazı widget'lar mevcut layout'ta olmayan alanlara atanmış. Otomatik olarak ilk alana taşındılar.
              </AlertDescription>
            </Alert>
          )}

          {/* Widget Selection */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2">Nasıl Kullanılır?</h4>
            <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
              <li>Görmek istediğiniz widget'ları seçin</li>
              <li>Her widget için hangi alana yerleştirileceğini belirleyin</li>
              <li>Yukarı/aşağı okları ile widget sırasını ayarlayın</li>
              <li>Değişiklikleri kaydedin</li>
            </ol>
          </div>

          {/* Widget Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Adım 1: Widget Seçimi</h3>
            <p className="text-xs text-muted-foreground mb-3">Dashboard'da görmek istediğiniz widget'ları seçin</p>
            <div className="grid gap-3 md:grid-cols-2">
              {AVAILABLE_WIDGETS.map((widget) => (
                <Card key={widget.id} className="p-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={widget.id}
                      checked={localVisible.includes(widget.id)}
                      onCheckedChange={() => handleToggleWidget(widget.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={widget.id} className="font-medium cursor-pointer">
                        {widget.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{widget.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Widget Positioning */}
          {localVisible.length > 0 ? (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">Adım 2: Alan Ataması ve Sıralama</h3>
                  <p className="text-xs text-muted-foreground">Her widget'ı bir alana atayın ve sırasını belirleyin</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetAllPositions}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tüm Atamaları Sıfırla
                </Button>
              </div>

              {widgetsByArea.map(({ area, widgets }) => (
                <div key={area.value} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h4 className="text-sm font-semibold text-primary">{area.label}</h4>
                    <span className="text-xs text-muted-foreground">({widgets.length} widget)</span>
                  </div>
                  {widgets.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-4 border-2 border-dashed rounded-lg bg-muted/20">
                      Bu alana henüz widget eklenmedi. Yukarıdaki widget'lardan birini seçin ve bu alana atayın.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {widgets.map((widgetId, index) => {
                        const widget = AVAILABLE_WIDGETS.find((w) => w.id === widgetId)
                        if (!widget) return null
                        const position = localPositions[widgetId] || { area: area.value, order: 0 }
                        const sameAreaWidgets = widgets.length

                        return (
                          <div
                            key={widgetId}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <GripVertical className="h-4 w-4" />
                              <span className="text-xs font-mono w-4">{index + 1}</span>
                            </div>
                            <span className="flex-1 font-medium text-sm">{widget.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Alan:</span>
                              <Select
                                value={position.area}
                                onValueChange={(newArea) => handleAreaChange(widgetId, newArea)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {areas.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>
                                      {a.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveUp(widgetId)}
                                disabled={widgets.indexOf(widgetId) === 0}
                                title="Yukarı taşı"
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveDown(widgetId)}
                                disabled={widgets.indexOf(widgetId) === sameAreaWidgets - 1}
                                title="Aşağı taşı"
                              >
                                ↓
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Widget seçimi yapın, ardından alanlara atama yapabilirsiniz
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
