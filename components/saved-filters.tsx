"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Save, Filter, Star, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SavedFiltersProps {
  entityType: "ships" | "fixtures" | "voyages" | "invoices"
  currentFilters: Record<string, any>
  onApplyFilter: (filters: Record<string, any>) => void
}

export function SavedFilters({ entityType, currentFilters, onApplyFilter }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<any[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSavedFilters()
  }, [entityType])

  const loadSavedFilters = async () => {
    try {
      const response = await fetch(`/api/saved-filters?entityType=${entityType}`)
      if (response.ok) {
        const data = await response.json()
        setSavedFilters(data)
      }
    } catch (error) {
      console.error("Error loading saved filters:", error)
    }
  }

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen filtre adı girin",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: filterName,
          entityType,
          filters: currentFilters,
          isDefault,
        }),
      })

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Filtre kaydedildi",
        })
        setFilterName("")
        setIsDefault(false)
        setSaveDialogOpen(false)
        loadSavedFilters()
      }
    } catch (error) {
      console.error("Error saving filter:", error)
      toast({
        title: "Hata",
        description: "Filtre kaydedilemedi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFilter = async (filterId: string) => {
    try {
      const response = await fetch(`/api/saved-filters/${filterId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Filtre silindi",
        })
        loadSavedFilters()
      }
    } catch (error) {
      console.error("Error deleting filter:", error)
      toast({
        title: "Hata",
        description: "Filtre silinemedi",
        variant: "destructive",
      })
    }
  }

  const handleApplyFilter = (filter: any) => {
    onApplyFilter(filter.filters)
    toast({
      title: "Filtre Uygulandı",
      description: `"${filter.name}" filtresi uygulandı`,
    })
  }

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Kayıtlı Filtreler
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {savedFilters.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Kayıtlı filtre yok</div>
          ) : (
            savedFilters.map((filter) => (
              <DropdownMenuItem key={filter.id} className="flex items-center justify-between">
                <button className="flex items-center gap-2 flex-1" onClick={() => handleApplyFilter(filter)}>
                  {filter.is_default && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                  <span>{filter.name}</span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFilter(filter.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Filtreyi Kaydet
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtreyi Kaydet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Filtre Adı</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Örn: Aktif Gemiler"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="is-default" checked={isDefault} onCheckedChange={(checked) => setIsDefault(!!checked)} />
              <Label htmlFor="is-default" className="cursor-pointer">
                Varsayılan filtre olarak ayarla
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveFilter}>Kaydet</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
