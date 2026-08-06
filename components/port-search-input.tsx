"use client"

import { CommandInput } from "@/components/ui/command"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2, AlertCircle, Edit } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Port {
  id: string
  port_name: string
  country_iso: string
  country_name: string
  unlocode: string
  port_type: string
  lat: number
  lon: number
  area_global?: string
  area_local?: string
}

interface PortSearchInputProps {
  label?: string
  value: string
  onChange: (portName: string, portData?: Port) => void
  onPortSelect?: (portData: Port) => void
  placeholder?: string
}

export function PortSearchInput({ label, value, onChange, onPortSelect, placeholder }: PortSearchInputProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const [ports, setPorts] = useState<Port[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length < 2) {
      setPorts([])
      setError(null)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPorts(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const searchPorts = async (query: string) => {
    setLoading(true)
    setError(null)
    console.log("[v0] PortSearchInput: Starting port search for:", query)

    try {
      const url = `/api/ports/search?q=${encodeURIComponent(query)}`
      console.log("[v0] PortSearchInput: Fetching from:", url)

      const response = await fetch(url)
      console.log("[v0] PortSearchInput: Response status:", response.status)

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] PortSearchInput: Non-JSON response received")
          setError("Sunucu hatası. Lütfen daha sonra tekrar deneyin.")
          setPorts([])
          return
        }

        const data = await response.json()
        console.log("[v0] PortSearchInput: Response data:", data)

        const portsData = data.ports || []
        console.log("[v0] PortSearchInput: Ports found:", portsData.length)

        setPorts(portsData)

        if (portsData.length === 0) {
          setError(data.error || "Liman bulunamadı. Manuel olarak ekleyebilirsiniz.")
        }
      } else if (response.status === 429) {
        setError("Çok fazla istek. Lütfen birkaç saniye bekleyin.")
        setPorts([])
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] PortSearchInput: API error:", response.status, errorData)
        setError(`API hatası: ${errorData.error || response.statusText}`)
        setPorts([])
      }
    } catch (error) {
      console.error("[v0] PortSearchInput: Network error:", error)
      setError("Bağlantı hatası. Manuel giriş kullanabilirsiniz.")
      setPorts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (port: Port) => {
    console.log("[v0] PortSearchInput: Port selected:", port)
    setSearchQuery(port.port_name)
    onChange(port.port_name, port)
    if (onPortSelect) {
      console.log("[v0] PortSearchInput: Calling onPortSelect callback")
      onPortSelect(port)
    }
    setOpen(false)
    setError(null)
  }

  const handleAddCustomPort = () => {
    const portName = searchQuery.trim() || value.trim()
    console.log("[v0] PortSearchInput: Adding custom port:", portName)
    if (portName) {
      onChange(portName)
      setOpen(false)
      setError(null)
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background hover:bg-accent"
            type="button"
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className={searchQuery ? "text-foreground" : "text-muted-foreground"}>
                {searchQuery || placeholder || "Liman ara..."}
              </span>
            </div>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Liman adı girin (en az 2 karakter)..."
              value={searchQuery}
              onValueChange={(val) => {
                console.log("[v0] PortSearchInput: Search query changed:", val)
                setSearchQuery(val)
              }}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Limanlar aranıyor...</span>
                </div>
              )}
              {!loading && searchQuery.length < 2 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Arama yapmak için en az 2 karakter girin
                </div>
              )}
              {!loading && error && (
                <div className="p-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
              {!loading && ports.length > 0 && (
                <CommandGroup heading={`${ports.length} liman bulundu`}>
                  {ports.map((port) => (
                    <CommandItem
                      key={port.id}
                      value={port.port_name}
                      onSelect={() => handleSelect(port)}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-primary" />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{port.port_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {port.country_name} • {port.unlocode} • {port.port_type}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!loading && searchQuery.length >= 2 && (
                <>
                  {ports.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="Manuel Giriş">
                    <CommandItem onSelect={handleAddCustomPort} className="cursor-pointer bg-muted/30 hover:bg-muted">
                      <Edit className="mr-2 h-4 w-4 text-primary" />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">
                          {searchQuery ? `"${searchQuery}" olarak manuel ekle` : "Manuel liman ekle"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ports.length > 0 ? "Veritabanında bulunamayan özel liman adı" : "Bu liman adını kullan"}
                        </span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
