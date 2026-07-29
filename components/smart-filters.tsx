"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Save, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SmartFiltersProps {
  entityType: string
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  filterFields: Array<{
    key: string
    label: string
    type: "text" | "select" | "date"
    options?: Array<{ value: string; label: string }>
  }>
}

export function SmartFilters({ entityType, filters, onFiltersChange, filterFields }: SmartFiltersProps) {
  const { toast } = useToast()
  const [savedFilters, setSavedFilters] = useState<any[]>([])
  const [filterName, setFilterName] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadSavedFilters()
  }, [entityType])

  const loadSavedFilters = async () => {
    try {
      const res = await fetch(`/api/saved-filters?entityType=${entityType}`)
      if (res.ok) {
        const data = await res.json()
        setSavedFilters(data)
      }
    } catch (error) {
      console.error("Failed to load saved filters:", error)
    }
  }

  const saveFilter = async () => {
    if (!filterName.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen filtre adı girin",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: filterName,
          entityType,
          filters,
        }),
      })

      if (res.ok) {
        toast({
          title: "Başarılı",
          description: "Filtre kaydedildi",
        })
        setFilterName("")
        loadSavedFilters()
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Filtre kaydedilemedi",
        variant: "destructive",
      })
    }
  }

  const loadFilter = (savedFilter: any) => {
    onFiltersChange(savedFilter.filters)
    setOpen(false)
    toast({
      title: "Filtre yüklendi",
      description: savedFilter.name,
    })
  }

  const deleteFilter = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-filters/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Başarılı",
          description: "Filtre silindi",
        })
        loadSavedFilters()
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Filtre silinemedi",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Akıllı Filtreler
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Akıllı Filtreler</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Filters */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Mevcut Filtreler</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {filterFields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {field.type === "select" ? (
                    <Select
                      value={filters[field.key] || ""}
                      onValueChange={(value) => onFiltersChange({ ...filters, [field.key]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      value={filters[field.key] || ""}
                      onChange={(e) => onFiltersChange({ ...filters, [field.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Input placeholder="Filtre adı" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
              <Button onClick={saveFilter}>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </div>
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Kayıtlı Filtreler</h3>
              <div className="space-y-2">
                {savedFilters.map((savedFilter) => (
                  <div key={savedFilter.id} className="flex items-center justify-between p-3 border rounded-md">
                    <button onClick={() => loadFilter(savedFilter)} className="flex-1 text-left hover:text-primary">
                      <p className="font-medium">{savedFilter.name}</p>
                      <p className="text-xs text-muted-foreground">{Object.keys(savedFilter.filters).length} filtre</p>
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => deleteFilter(savedFilter.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
