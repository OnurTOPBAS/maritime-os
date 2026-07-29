"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Fuel, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface MarketPrice {
  id: string
  name: string
  value: number
  change: number
  unit: string
  category: "index" | "fuel" | "currency" | "commodity"
}

const ALL_MARKET_PRICES: MarketPrice[] = [
  { id: "bdi", name: "Baltic Dry Index", value: 1842, change: 2.3, unit: "points", category: "index" },
  { id: "bci", name: "Baltic Capesize Index", value: 2156, change: 1.8, unit: "points", category: "index" },
  { id: "bpi", name: "Baltic Panamax Index", value: 1523, change: -0.5, unit: "points", category: "index" },
  { id: "bsi", name: "Baltic Supramax Index", value: 1234, change: 1.2, unit: "points", category: "index" },
  { id: "ifo380-sg", name: "IFO 380 (Singapur)", value: 485, change: -1.2, unit: "$/ton", category: "fuel" },
  { id: "ifo380-rt", name: "IFO 380 (Rotterdam)", value: 492, change: -0.8, unit: "$/ton", category: "fuel" },
  { id: "mgo-rt", name: "MGO (Rotterdam)", value: 720, change: 1.8, unit: "$/ton", category: "fuel" },
  { id: "mgo-sg", name: "MGO (Singapur)", value: 735, change: 2.1, unit: "$/ton", category: "fuel" },
  { id: "vlsfo", name: "VLSFO (Rotterdam)", value: 615, change: 0.5, unit: "$/ton", category: "fuel" },
  { id: "usd-eur", name: "USD/EUR", value: 0.92, change: 0.5, unit: "", category: "currency" },
  { id: "usd-gbp", name: "USD/GBP", value: 0.79, change: -0.3, unit: "", category: "currency" },
  { id: "usd-try", name: "USD/TRY", value: 32.45, change: 0.8, unit: "", category: "currency" },
  { id: "iron-ore", name: "Demir Cevheri", value: 115, change: -0.8, unit: "$/ton", category: "commodity" },
  { id: "coal", name: "Kömür (Newcastle)", value: 142, change: 3.2, unit: "$/ton", category: "commodity" },
  { id: "grain", name: "Tahıl (Chicago)", value: 245, change: 1.5, unit: "$/ton", category: "commodity" },
]

interface MarketPricesPreferences {
  selectedPrices: string[]
}

export function MarketPricesWidget() {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [preferences, setPreferences] = useState<MarketPricesPreferences>({
    selectedPrices: ["bdi", "ifo380-sg", "mgo-rt", "usd-eur", "iron-ore", "coal"],
  })

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/widget-preferences?widgetId=market-prices")
        if (response.ok) {
          const data = await response.json()
          if (data.preferences && data.preferences.selectedPrices) {
            setPreferences(data.preferences)
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
      }
    }
    loadPreferences()
  }, [])

  useEffect(() => {
    const selectedPriceData = ALL_MARKET_PRICES.filter((price) => preferences.selectedPrices.includes(price.id))
    setTimeout(() => {
      setPrices(selectedPriceData)
      setLoading(false)
    }, 500)
  }, [preferences])

  const handleSavePreferences = async () => {
    try {
      await fetch("/api/widget-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: "market-prices",
          preferences,
        }),
      })
      setSettingsOpen(false)
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  const handleTogglePrice = (priceId: string) => {
    setPreferences((prev) => ({
      ...prev,
      selectedPrices: prev.selectedPrices.includes(priceId)
        ? prev.selectedPrices.filter((id) => id !== priceId)
        : [...prev.selectedPrices, priceId],
    }))
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "index":
        return "Endeksler"
      case "fuel":
        return "Yakıt Fiyatları"
      case "currency":
        return "Döviz Kurları"
      case "commodity":
        return "Emtia Fiyatları"
      default:
        return category
    }
  }

  if (loading) {
    return (
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="text-lg">Piyasa Fiyatları</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Piyasa Fiyatları</CardTitle>
            <CardDescription>Güncel piyasa endeksleri ve fiyatlar</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Piyasa Fiyatları Ayarları</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Görmek istediğiniz endeksleri, yakıt fiyatlarını, döviz kurlarını ve emtia fiyatlarını seçin.
                  </p>
                  {["index", "fuel", "currency", "commodity"].map((category) => {
                    const categoryPrices = ALL_MARKET_PRICES.filter((p) => p.category === category)
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-semibold text-sm">{getCategoryLabel(category)}</h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {categoryPrices.map((price) => (
                            <div key={price.id} className="flex items-center space-x-2 p-2 border rounded">
                              <Checkbox
                                id={price.id}
                                checked={preferences.selectedPrices.includes(price.id)}
                                onCheckedChange={() => handleTogglePrice(price.id)}
                              />
                              <Label htmlFor={price.id} className="cursor-pointer flex-1">
                                {price.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleSavePreferences}>Kaydet</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <DollarSign className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ayarlardan görmek istediğiniz fiyatları seçin
          </p>
        ) : (
          prices.map((price, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {price.category === "fuel" ? (
                  <Fuel className="h-4 w-4 text-amber-500" />
                ) : (
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{price.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {price.value.toLocaleString()} {price.unit}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${price.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {price.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-semibold">
                  {price.change > 0 ? "+" : ""}
                  {price.change}%
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
