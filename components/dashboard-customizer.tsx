"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Settings2, GripVertical } from "lucide-react"

interface DashboardCustomizerProps {
  preferences: {
    widgetOrder: string[]
    visibleWidgets: string[]
  }
  onSave: (preferences: { widgetOrder: string[]; visibleWidgets: string[] }) => void
}

const AVAILABLE_WIDGETS = [
  { id: "stats", label: "İstatistikler", description: "Genel sistem istatistikleri" },
  { id: "activity", label: "Son Aktiviteler", description: "Son fixture ve sefer hareketleri" },
  { id: "financial", label: "Finansal Özet", description: "Gelir, gider ve kar/zarar özeti" },
  { id: "companies", label: "Şirketlerim", description: "Şirket listesi" },
]

export function DashboardCustomizer({ preferences, onSave }: DashboardCustomizerProps) {
  const [open, setOpen] = useState(false)
  const [visibleWidgets, setVisibleWidgets] = useState(preferences.visibleWidgets)
  const [widgetOrder, setWidgetOrder] = useState(preferences.widgetOrder)

  const handleToggleWidget = (widgetId: string) => {
    setVisibleWidgets((prev) => (prev.includes(widgetId) ? prev.filter((id) => id !== widgetId) : [...prev, widgetId]))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...widgetOrder]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setWidgetOrder(newOrder)
  }

  const handleMoveDown = (index: number) => {
    if (index === widgetOrder.length - 1) return
    const newOrder = [...widgetOrder]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setWidgetOrder(newOrder)
  }

  const handleSave = async () => {
    await onSave({ widgetOrder, visibleWidgets })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Dashboard Özelleştir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dashboard Özelleştirme</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Görünür Widget'lar</h3>
            <div className="space-y-3">
              {AVAILABLE_WIDGETS.map((widget) => (
                <div key={widget.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={widget.id}
                    checked={visibleWidgets.includes(widget.id)}
                    onCheckedChange={() => handleToggleWidget(widget.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={widget.id} className="font-medium cursor-pointer">
                      {widget.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{widget.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Widget Sıralaması</h3>
            <div className="space-y-2">
              {widgetOrder.map((widgetId, index) => {
                const widget = AVAILABLE_WIDGETS.find((w) => w.id === widgetId)
                if (!widget) return null
                return (
                  <div key={widgetId} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 font-medium">{widget.label}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === widgetOrder.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
