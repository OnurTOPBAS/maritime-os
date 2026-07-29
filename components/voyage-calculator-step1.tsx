"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Ship, User, Gauge, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface VoyageCalculatorStep1Props {
  calculationId: string
  calculation: any
  onComplete: () => void
}

export function VoyageCalculatorStep1({ calculationId, calculation, onComplete }: VoyageCalculatorStep1Props) {
  const { toast } = useToast()
  const [ships, setShips] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    ship_id: calculation?.ship_id || "",
    ship_name: calculation?.ship_name || "",
    charterer_id: calculation?.charterer_id || "",
    charterer_name: calculation?.charterer_name || "",
    service_speed: calculation?.service_speed || "",
    daily_running_cost: calculation?.daily_running_cost || "",
  })
  const [selectedShipType, setSelectedShipType] = useState<"fleet" | "manual">(
    calculation?.ship_id ? "fleet" : "manual",
  )

  useEffect(() => {
    fetchShips()
    fetchCompanies()
  }, [])

  const fetchShips = async () => {
    try {
      const response = await fetch("/api/ships")
      if (response.ok) {
        const data = await response.json()
        setShips(data)
      }
    } catch (error) {
      console.error("Error fetching ships:", error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const handleShipSelect = async (shipId: string) => {
    const ship = ships.find((s) => s.id === Number.parseInt(shipId))
    if (ship) {
      setFormData({
        ...formData,
        ship_id: shipId,
        ship_name: ship.name,
      })

      // Auto-pull fuel consumption data if available
      toast({
        title: "Gemi seçildi",
        description: `${ship.name} gemisinin yakıt tüketim verileri otomatik olarak kullanılacak.`,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ship_id: selectedShipType === "fleet" && formData.ship_id ? Number.parseInt(formData.ship_id) : null,
        ship_name:
          selectedShipType === "manual"
            ? formData.ship_name
            : ships.find((s) => s.id === Number.parseInt(formData.ship_id))?.name,
        charterer_id: formData.charterer_id ? Number.parseInt(formData.charterer_id) : null,
        charterer_name: formData.charterer_id
          ? companies.find((c) => c.id === Number.parseInt(formData.charterer_id))?.name
          : formData.charterer_name,
        service_speed: Number.parseFloat(formData.service_speed),
        daily_running_cost: Number.parseFloat(formData.daily_running_cost),
      }

      const response = await fetch(`/api/voyage-calculator/${calculationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Temel bilgiler kaydedildi. Rota bacaklarını ekleyebilirsiniz.",
        })
        onComplete()
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving step 1:", error)
      toast({
        title: "Hata",
        description: "Bilgiler kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Ship Selection */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Ship className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Gemi Bilgileri</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Gemi Seçim Tipi</Label>
              <Select
                value={selectedShipType}
                onValueChange={(value: "fleet" | "manual") => {
                  setSelectedShipType(value)
                  setFormData({ ...formData, ship_id: "", ship_name: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fleet">Filo Gemisi</SelectItem>
                  <SelectItem value="manual">Manuel Giriş</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedShipType === "fleet" ? (
              <div>
                <Label htmlFor="ship_id">Gemi Seçin</Label>
                <Select value={formData.ship_id} onValueChange={handleShipSelect}>
                  <SelectTrigger id="ship_id">
                    <SelectValue placeholder="Gemi seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ships.map((ship) => (
                      <SelectItem key={ship.id} value={ship.id.toString()}>
                        {ship.name} - {ship.vessel_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Filo gemisi seçildiğinde yakıt tüketim verileri otomatik çekilir
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="ship_name">Gemi Adı</Label>
                <Input
                  id="ship_name"
                  value={formData.ship_name}
                  onChange={(e) => setFormData({ ...formData, ship_name: e.target.value })}
                  placeholder="Gemi adını girin..."
                  required
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charterer Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Potansiyel Kiracı</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="charterer_id">Kiracı Seçin (Opsiyonel)</Label>
              <Select
                value={formData.charterer_id}
                onValueChange={(value) => setFormData({ ...formData, charterer_id: value, charterer_name: "" })}
              >
                <SelectTrigger id="charterer_id">
                  <SelectValue placeholder="Kiracı seçin veya manuel girin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel Giriş</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!formData.charterer_id && (
              <div>
                <Label htmlFor="charterer_name">Kiracı Adı (Manuel)</Label>
                <Input
                  id="charterer_name"
                  value={formData.charterer_name}
                  onChange={(e) => setFormData({ ...formData, charterer_name: e.target.value })}
                  placeholder="Kiracı adını girin..."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voyage Parameters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Sefer Parametreleri</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_speed">Servis Hızı (knot)</Label>
              <Input
                id="service_speed"
                type="number"
                step="0.1"
                value={formData.service_speed}
                onChange={(e) => setFormData({ ...formData, service_speed: e.target.value })}
                placeholder="Örn: 12.5"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Deniz günü hesaplamasında kullanılacak</p>
            </div>

            <div>
              <Label htmlFor="daily_running_cost">Günlük Running Cost (USD)</Label>
              <Input
                id="daily_running_cost"
                type="number"
                step="0.01"
                value={formData.daily_running_cost}
                onChange={(e) => setFormData({ ...formData, daily_running_cost: e.target.value })}
                placeholder="Örn: 5000"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Günlük işletme maliyeti</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {formData.ship_name && formData.service_speed && formData.daily_running_cost && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Özet</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gemi:</span>
                <span className="font-medium">{formData.ship_name}</span>
              </div>
              {(formData.charterer_name || formData.charterer_id) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kiracı:</span>
                  <span className="font-medium">
                    {formData.charterer_id
                      ? companies.find((c) => c.id === Number.parseInt(formData.charterer_id))?.name
                      : formData.charterer_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servis Hızı:</span>
                <span className="font-medium">{formData.service_speed} knot</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Günlük Maliyet:</span>
                <span className="font-medium">${Number.parseFloat(formData.daily_running_cost).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Kaydediliyor..." : "Kaydet ve Devam Et"}
        </Button>
      </div>
    </form>
  )
}
