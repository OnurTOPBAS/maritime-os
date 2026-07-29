"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { LayoutGrid, Columns3, PanelLeft, PanelRight, Grid3x3, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CustomLayout {
  id: string
  name: string
  areas: Array<{ id: string; width: string; order: number }>
}

interface LayoutSelectorProps {
  currentLayout: string
  customLayouts: CustomLayout[]
  onLayoutChange: (layout: string) => void
}

const PRESET_LAYOUTS = [
  {
    id: "grid-2col",
    name: "2 Sütun Grid",
    description: "Widget'lar 2 sütunlu grid düzeninde",
    icon: LayoutGrid,
    preview: "grid grid-cols-2 gap-2",
  },
  {
    id: "grid-3col",
    name: "3 Sütun Grid",
    description: "Widget'lar 3 sütunlu grid düzeninde",
    icon: Columns3,
    preview: "grid grid-cols-3 gap-2",
  },
  {
    id: "sidebar-left",
    name: "Sol Kenar Çubuğu",
    description: "Sol tarafta dar panel, sağda ana içerik",
    icon: PanelLeft,
    preview: "grid grid-cols-[200px_1fr] gap-2",
  },
  {
    id: "sidebar-right",
    name: "Sağ Kenar Çubuğu",
    description: "Sağ tarafta dar panel, solda ana içerik",
    icon: PanelRight,
    preview: "grid grid-cols-[1fr_200px] gap-2",
  },
  {
    id: "masonry",
    name: "Masonry (Esnek)",
    description: "Widget'lar esnek boyutlarda yerleşir",
    icon: Grid3x3,
    preview: "columns-2 gap-2",
  },
]

export function DashboardLayoutSelector({ currentLayout, customLayouts, onLayoutChange }: LayoutSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedLayout, setSelectedLayout] = useState(currentLayout)

  const handleSave = () => {
    onLayoutChange(selectedLayout)
    setOpen(false)
  }

  const allLayouts = [
    ...PRESET_LAYOUTS,
    ...customLayouts.map((layout) => ({
      id: layout.id,
      name: layout.name,
      description: `Özel layout - ${layout.areas.length} alan`,
      icon: Sparkles,
      preview: "grid grid-cols-12 gap-2",
      custom: true,
      areas: layout.areas,
    })),
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LayoutGrid className="h-4 w-4 mr-2" />
          Layout Seç
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Layout Seçimi</DialogTitle>
        </DialogHeader>
        <RadioGroup value={selectedLayout} onValueChange={setSelectedLayout}>
          <div className="grid gap-4 md:grid-cols-2">
            {allLayouts.map((layout) => {
              const Icon = layout.icon
              return (
                <Card
                  key={layout.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedLayout === layout.id ? "ring-2 ring-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedLayout(layout.id)}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={layout.id} id={layout.id} />
                    <div className="flex-1">
                      <Label htmlFor={layout.id} className="flex items-center gap-2 font-semibold cursor-pointer">
                        <Icon className="h-5 w-5" />
                        {layout.name}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{layout.description}</p>
                      {/* Preview */}
                      <div className={`mt-3 h-20 ${layout.preview} bg-muted/30 rounded p-1`}>
                        {layout.custom && layout.areas ? (
                          layout.areas.map((area, index) => {
                            const widthClass =
                              area.width === "full"
                                ? "col-span-12"
                                : area.width === "1/2"
                                  ? "col-span-6"
                                  : area.width === "1/3"
                                    ? "col-span-4"
                                    : area.width === "2/3"
                                      ? "col-span-8"
                                      : area.width === "1/4"
                                        ? "col-span-3"
                                        : area.width === "3/4"
                                          ? "col-span-9"
                                          : "col-span-12"
                            return <div key={index} className={`${widthClass} bg-primary/20 rounded h-full`} />
                          })
                        ) : layout.id === "grid-2col" ? (
                          <>
                            <div className="bg-primary/20 rounded h-full" />
                            <div className="bg-primary/20 rounded h-full" />
                          </>
                        ) : layout.id === "grid-3col" ? (
                          <>
                            <div className="bg-primary/20 rounded h-full" />
                            <div className="bg-primary/20 rounded h-full" />
                            <div className="bg-primary/20 rounded h-full" />
                          </>
                        ) : layout.id === "sidebar-left" ? (
                          <>
                            <div className="bg-primary/30 rounded h-full" />
                            <div className="bg-primary/20 rounded h-full" />
                          </>
                        ) : layout.id === "sidebar-right" ? (
                          <>
                            <div className="bg-primary/20 rounded h-full" />
                            <div className="bg-primary/30 rounded h-full" />
                          </>
                        ) : layout.id === "masonry" ? (
                          <>
                            <div className="space-y-1">
                              <div className="bg-primary/20 rounded h-8" />
                              <div className="bg-primary/20 rounded h-10" />
                            </div>
                            <div className="space-y-1">
                              <div className="bg-primary/20 rounded h-10" />
                              <div className="bg-primary/20 rounded h-8" />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </RadioGroup>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>Layout Uygula</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
