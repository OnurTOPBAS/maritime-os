"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Pencil } from "lucide-react"

interface LayoutArea {
  id: string
  width: string
  order: number
}

interface CustomLayout {
  id: string
  name: string
  areas: LayoutArea[]
}

interface CustomLayoutBuilderProps {
  customLayouts: CustomLayout[]
  onSave: (layouts: CustomLayout[]) => void
}

const WIDTH_OPTIONS = [
  { value: "full", label: "Tam Genişlik (100%)", class: "col-span-12" },
  { value: "1/2", label: "Yarım (50%)", class: "col-span-6" },
  { value: "1/3", label: "Üçte Bir (33%)", class: "col-span-4" },
  { value: "2/3", label: "Üçte İki (66%)", class: "col-span-8" },
  { value: "1/4", label: "Çeyrek (25%)", class: "col-span-3" },
  { value: "3/4", label: "Üç Çeyrek (75%)", class: "col-span-9" },
]

export function CustomLayoutBuilder({ customLayouts, onSave }: CustomLayoutBuilderProps) {
  const [open, setOpen] = useState(false)
  const [editingLayout, setEditingLayout] = useState<CustomLayout | null>(null)
  const [layoutName, setLayoutName] = useState("")
  const [areas, setAreas] = useState<LayoutArea[]>([{ id: "area-1", width: "full", order: 0 }])

  const handleStartNew = () => {
    setEditingLayout(null)
    setLayoutName("")
    setAreas([{ id: "area-1", width: "full", order: 0 }])
  }

  const handleEdit = (layout: CustomLayout) => {
    setEditingLayout(layout)
    setLayoutName(layout.name)
    setAreas(layout.areas)
  }

  const handleAddArea = () => {
    const newArea: LayoutArea = {
      id: `area-${Date.now()}`,
      width: "1/2",
      order: areas.length,
    }
    setAreas([...areas, newArea])
  }

  const handleRemoveArea = (areaId: string) => {
    setAreas(areas.filter((a) => a.id !== areaId))
  }

  const handleWidthChange = (areaId: string, width: string) => {
    setAreas(areas.map((a) => (a.id === areaId ? { ...a, width } : a)))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newAreas = [...areas]
    ;[newAreas[index - 1], newAreas[index]] = [newAreas[index], newAreas[index - 1]]
    newAreas.forEach((area, i) => (area.order = i))
    setAreas(newAreas)
  }

  const handleMoveDown = (index: number) => {
    if (index === areas.length - 1) return
    const newAreas = [...areas]
    ;[newAreas[index], newAreas[index + 1]] = [newAreas[index + 1], newAreas[index]]
    newAreas.forEach((area, i) => (area.order = i))
    setAreas(newAreas)
  }

  const handleSaveLayout = () => {
    if (!layoutName.trim()) {
      alert("Lütfen layout için bir isim girin")
      return
    }

    const newLayout: CustomLayout = {
      id: editingLayout?.id || `custom-${Date.now()}`,
      name: layoutName,
      areas: areas.map((a, i) => ({ ...a, order: i })),
    }

    let updatedLayouts: CustomLayout[]
    if (editingLayout) {
      updatedLayouts = customLayouts.map((l) => (l.id === editingLayout.id ? newLayout : l))
    } else {
      updatedLayouts = [...customLayouts, newLayout]
    }

    onSave(updatedLayouts)
    handleStartNew()
  }

  const handleDeleteLayout = (layoutId: string) => {
    if (confirm("Bu layout'u silmek istediğinizden emin misiniz?")) {
      onSave(customLayouts.filter((l) => l.id !== layoutId))
    }
  }

  const getWidthClass = (width: string) => {
    return WIDTH_OPTIONS.find((w) => w.value === width)?.class || "col-span-12"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Özel Layout Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Özel Layout Oluşturucu</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Custom Layouts */}
          {customLayouts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Mevcut Özel Layout'lar</h3>
              <div className="grid gap-2">
                {customLayouts.map((layout) => (
                  <Card key={layout.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{layout.name}</p>
                        <p className="text-xs text-muted-foreground">{layout.areas.length} alan</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(layout)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLayout(layout.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Layout Builder */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                {editingLayout ? `"${editingLayout.name}" Düzenleniyor` : "Yeni Layout Oluştur"}
              </h3>
              {editingLayout && (
                <Button variant="outline" size="sm" onClick={handleStartNew}>
                  Yeni Layout
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Layout Name */}
              <div>
                <Label htmlFor="layout-name">Layout Adı</Label>
                <Input
                  id="layout-name"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="Örn: Sol Kenar + 2 Sütun"
                />
              </div>

              {/* Areas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Alanlar</Label>
                  <Button variant="outline" size="sm" onClick={handleAddArea}>
                    <Plus className="h-4 w-4 mr-1" />
                    Alan Ekle
                  </Button>
                </div>

                <div className="space-y-3">
                  {areas.map((area, index) => (
                    <Card key={area.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16">Alan {index + 1}</span>
                        <Select value={area.width} onValueChange={(width) => handleWidthChange(area.id, width)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WIDTH_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === areas.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveArea(area.id)}
                            disabled={areas.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label>Önizleme</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-12 gap-3">
                    {areas.map((area, index) => (
                      <div key={area.id} className={`${getWidthClass(area.width)} bg-primary/20 rounded p-3 min-h-20`}>
                        <p className="text-xs font-medium">Alan {index + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {WIDTH_OPTIONS.find((w) => w.value === area.width)?.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSaveLayout}>{editingLayout ? "Güncelle" : "Layout Kaydet"}</Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
