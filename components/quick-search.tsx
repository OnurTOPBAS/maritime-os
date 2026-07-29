"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Ship, FileText, Anchor, Loader2, Building2, Layers, Navigation } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  type: "company" | "fleet" | "ship" | "fixture" | "voyage" | "invoice"
  title: string
  subtitle?: string
  href: string
}

export function QuickSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Performing search for:", searchQuery)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Search results:", data.results)
        setResults(data.results || [])
      } else {
        console.error("[v0] Search failed with status:", response.status)
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSelect = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "company":
        return <Building2 className="h-4 w-4" />
      case "fleet":
        return <Layers className="h-4 w-4" />
      case "ship":
        return <Ship className="h-4 w-4" />
      case "fixture":
        return <Anchor className="h-4 w-4" />
      case "voyage":
        return <Navigation className="h-4 w-4" />
      case "invoice":
        return <FileText className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "company":
        return "Şirketler"
      case "fleet":
        return "Filolar"
      case "ship":
        return "Gemiler"
      case "fixture":
        return "Fixture'lar"
      case "voyage":
        return "Seferler"
      case "invoice":
        return "Faturalar"
      default:
        return type
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md hover:bg-muted transition-colors w-full md:w-64"
      >
        <Search className="h-4 w-4" />
        <span>Ara...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Şirket, filo, gemi, fixture, sefer veya fatura ara..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && query && results.length === 0 && <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>}
          {!loading && results.length > 0 && (
            <>
              {["company", "fleet", "ship", "fixture", "voyage", "invoice"].map((type) => {
                const typeResults = results.filter((r) => r.type === type)
                if (typeResults.length === 0) return null

                return (
                  <CommandGroup key={type} heading={getTypeLabel(type)}>
                    {typeResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.href)}
                        className="flex items-center gap-2"
                      >
                        {getIcon(result.type)}
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && <span className="text-xs text-muted-foreground">{result.subtitle}</span>}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
