"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoyageCalculatorFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  search: string
  status: string
  profitability: string
  tags: string[]
}

const AVAILABLE_TAGS = ["Acil", "Onaylandı", "Reddedildi", "İnceleniyor", "Beklemede"]

export function VoyageCalculatorFilters({ onFilterChange }: VoyageCalculatorFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    profitability: "all",
    tags: [],
  })

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilters({ tags: [...filters.tags, tag] })
    }
  }

  const removeTag = (tag: string) => {
    updateFilters({ tags: filters.tags.filter((t) => t !== tag) })
  }

  const clearFilters = () => {
    const cleared = { search: "", status: "all", profitability: "all", tags: [] }
    setFilters(cleared)
    onFilterChange(cleared)
  }

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filtreler</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Temizle
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="search">Ara</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Gemi, kiracı..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Durum</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="approved">Onaylandı</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profitability">Karlılık</Label>
          <Select value={filters.profitability} onValueChange={(value) => updateFilters({ profitability: value })}>
            <SelectTrigger id="profitability">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="profitable">Karlı</SelectItem>
              <SelectItem value="unprofitable">Zararlı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Etiketler</Label>
          <Select onValueChange={addTag}>
            <SelectTrigger id="tags">
              <SelectValue placeholder="Etiket seç" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_TAGS.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
