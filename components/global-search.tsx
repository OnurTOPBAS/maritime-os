"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Ship, FileText, Anchor, Building2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  id: string
  type: string
  name: string
  description?: string
  url: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    onOpenChange(false)
    setQuery("")
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "ship":
        return <Ship className="h-4 w-4" />
      case "fixture":
        return <FileText className="h-4 w-4" />
      case "voyage":
        return <Anchor className="h-4 w-4" />
      case "company":
        return <Building2 className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ship: "Gemi",
      fixture: "Fixture",
      voyage: "Sefer",
      company: "Şirket",
      invoice: "Fatura",
    }
    return labels[type] || type
  }

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = []
      }
      acc[result.type].push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ara</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Gemi, fixture, sefer ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Aranıyor...</div>
          ) : results.length === 0 && query ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Sonuç bulunamadı</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type}>
                  <div className="mb-2 flex items-center gap-2">
                    {getIcon(type)}
                    <h3 className="text-sm font-semibold">{getTypeLabel(type)}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {items.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className="w-full rounded-md p-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{result.name}</div>
                        {result.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{result.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t pt-3 text-xs text-muted-foreground">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ESC
          </kbd>{" "}
          ile kapat
        </div>
      </DialogContent>
    </Dialog>
  )
}
