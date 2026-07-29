"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Ship, Anchor, Fuel, Package, Calendar, DollarSign } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface VoyageFormProps {
  fixtureId: string
  onSuccess: (voyage: any) => void
  voyage?: any
}

interface PortDetails {
  port_name: string
  cargo_quantity: string
  cargo_unit: string
  ata: string
  atb: string
  atc: string
  atd: string
  arrival_rob_fo: string
  arrival_rob_mgo: string
  departure_rob_fo: string
  departure_rob_mgo: string
  bunker_supply: boolean
  bunker_fo: string
  bunker_mgo: string
  fo_price: string
  mgo_price: string
  draft_aft: string
  draft_fore: string
  bl_date?: string
}

const normalizePortData = (port: any): PortDetails => {
  return {
    port_name: port?.port_name || "",
    cargo_quantity: port?.cargo_quantity?.toString() || "",
    cargo_unit: port?.cargo_unit || "MT",
    ata: port?.ata || "",
    atb: port?.atb || "",
    atc: port?.atc || "",
    atd: port?.atd || "",
    arrival_rob_fo: port?.arrival_rob_fo?.toString() || "",
    arrival_rob_mgo: port?.arrival_rob_mgo?.toString() || "",
    departure_rob_fo: port?.departure_rob_fo?.toString() || "",
    departure_rob_mgo: port?.departure_rob_mgo?.toString() || "",
    bunker_supply: port?.bunker_supply || false,
    bunker_fo: port?.bunker_fo?.toString() || "",
    bunker_mgo: port?.bunker_mgo?.toString() || "",
    fo_price: port?.fo_price?.toString() || "",
    mgo_price: port?.mgo_price?.toString() || "",
    draft_aft: port?.draft_aft?.toString() || "",
    draft_fore: port?.draft_fore?.toString() || "",
    bl_date: port?.bl_date || "",
  }
}

const formatDate = (date: any): string => {
  if (!date) return ""
  const dateStr = typeof date === "string" ? date : date.toString()
  return dateStr.split("T")[0]
}

export function VoyageForm({ fixtureId, onSuccess, voyage }: VoyageFormProps) {
  const [loading, setLoading] = useState(false)

  const [loadingPorts, setLoadingPorts] = useState<PortDetails[]>(
    voyage?.loading_ports?.length > 0 ? voyage.loading_ports.map(normalizePortData) : [normalizePortData(null)],
  )

  const [dischargePorts, setDischargePorts] = useState<PortDetails[]>(
    voyage?.discharge_ports?.length > 0 ? voyage.discharge_ports.map(normalizePortData) : [normalizePortData(null)],
  )

  const addLoadingPort = () => {
    setLoadingPorts([...loadingPorts, normalizePortData(null)])
  }

  const removeLoadingPort = (index: number) => {
    setLoadingPorts(loadingPorts.filter((_, i) => i !== index))
  }

  const updateLoadingPort = (index: number, field: keyof PortDetails, value: any) => {
    const updated = [...loadingPorts]
    updated[index] = { ...updated[index], [field]: value }
    setLoadingPorts(updated)
  }

  const addDischargePort = () => {
    setDischargePorts([...dischargePorts, normalizePortData(null)])
  }

  const removeDischargePort = (index: number) => {
    setDischargePorts(dischargePorts.filter((_, i) => i !== index))
  }

  const updateDischargePort = (index: number, field: keyof PortDetails, value: any) => {
    const updated = [...dischargePorts]
    updated[index] = { ...updated[index], [field]: value }
    setDischargePorts(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      fixture_id: fixtureId,
      voyage_number: formData.get("voyage_number"),
      status: formData.get("status"),
      notes: formData.get("notes"),
      loading_ports: loadingPorts,
      discharge_ports: dischargePorts,
      // Keep legacy fields for backward compatibility
      load_port: loadingPorts[0]?.port_name || "",
      discharge_port: dischargePorts[0]?.port_name || "",
      cargo_quantity: loadingPorts[0]?.cargo_quantity || null,
      cargo_unit: loadingPorts[0]?.cargo_unit || "MT",
    }

    try {
      const url = voyage ? `/api/voyages/${voyage.id}` : "/api/voyages"
      const method = voyage ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        onSuccess(result)
      }
    } catch (error) {
      console.error("[v0] Save voyage error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Ship className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Sefer Bilgileri</CardTitle>
              <CardDescription>Sefer detaylarını eksiksiz doldurun</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="voyage_number" className="text-base font-medium">
                Sefer Numarası *
              </Label>
              <Input
                id="voyage_number"
                name="voyage_number"
                defaultValue={voyage?.voyage_number}
                required
                className="h-11"
                placeholder="Örn: V-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-base font-medium">
                Durum
              </Label>
              <Select name="status" defaultValue={voyage?.status || "planned"}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Planlandı
                    </div>
                  </SelectItem>
                  <SelectItem value="loading">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      Yükleme
                    </div>
                  </SelectItem>
                  <SelectItem value="laden">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      Yüklü
                    </div>
                  </SelectItem>
                  <SelectItem value="discharging">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      Tahliye
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Tamamlandı
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
              <Anchor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Yükleme Limanları</h3>
              <p className="text-sm text-muted-foreground">Yükleme yapılacak limanları ekleyin</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLoadingPort} className="gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Liman Ekle
          </Button>
        </div>

        {loadingPorts.map((port, index) => (
          <Card key={index} className="border-blue-200 dark:border-blue-900">
            <CardHeader className="bg-blue-50/50 dark:bg-blue-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <CardTitle className="text-base">Yükleme Limanı {index + 1}</CardTitle>
                </div>
                {loadingPorts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLoadingPort(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Anchor className="h-4 w-4" />
                  Liman ve Kargo Bilgileri
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Liman Adı</Label>
                    <Input
                      value={port.port_name}
                      onChange={(e) => updateLoadingPort(index, "port_name", e.target.value)}
                      placeholder="Liman adını giriniz"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Kargo Miktarı</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={port.cargo_quantity}
                        onChange={(e) => updateLoadingPort(index, "cargo_quantity", e.target.value)}
                        placeholder="0.00"
                        className="h-10 flex-1"
                      />
                      <Select
                        value={port.cargo_unit}
                        onValueChange={(value) => updateLoadingPort(index, "cargo_unit", value)}
                      >
                        <SelectTrigger className="h-10 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="BBL">BBL</SelectItem>
                          <SelectItem value="CBM">CBM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Tarih Bilgileri
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-sm">ATA</Label>
                    <Input
                      type="date"
                      value={port.ata}
                      onChange={(e) => updateLoadingPort(index, "ata", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ATB</Label>
                    <Input
                      type="date"
                      value={port.atb}
                      onChange={(e) => updateLoadingPort(index, "atb", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ATC</Label>
                    <Input
                      type="date"
                      value={port.atc}
                      onChange={(e) => updateLoadingPort(index, "atc", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ATD</Label>
                    <Input
                      type="date"
                      value={port.atd}
                      onChange={(e) => updateLoadingPort(index, "atd", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Fuel className="h-4 w-4" />
                  Yakıt ROB Değerleri
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Varış ROB FO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.arrival_rob_fo}
                      onChange={(e) => updateLoadingPort(index, "arrival_rob_fo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Varış ROB MGO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.arrival_rob_mgo}
                      onChange={(e) => updateLoadingPort(index, "arrival_rob_mgo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Kalkış ROB FO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.departure_rob_fo}
                      onChange={(e) => updateLoadingPort(index, "departure_rob_fo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Kalkış ROB MGO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.departure_rob_mgo}
                      onChange={(e) => updateLoadingPort(index, "departure_rob_mgo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Yakıt Fiyatları
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">FO Fiyatı (USD/MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Yakıt fiyatı giriniz"
                      value={port.fo_price}
                      onChange={(e) => updateLoadingPort(index, "fo_price", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">MGO Fiyatı (USD/MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Yakıt fiyatı giriniz"
                      value={port.mgo_price}
                      onChange={(e) => updateLoadingPort(index, "mgo_price", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2 rounded-lg bg-muted/50 p-3">
                  <Checkbox
                    id={`bunker-supply-load-${index}`}
                    checked={port.bunker_supply}
                    onCheckedChange={(checked) => updateLoadingPort(index, "bunker_supply", checked === true)}
                  />
                  <Label htmlFor={`bunker-supply-load-${index}`} className="cursor-pointer font-medium">
                    Bunker İkmali Yapıldı
                  </Label>
                </div>

                {port.bunker_supply && (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Bunker FO (MT)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={port.bunker_fo}
                          onChange={(e) => updateLoadingPort(index, "bunker_fo", e.target.value)}
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Bunker MGO (MT)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={port.bunker_mgo}
                          onChange={(e) => updateLoadingPort(index, "bunker_mgo", e.target.value)}
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Diğer Bilgiler
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Departure Draft Aft (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.draft_aft}
                      onChange={(e) => updateLoadingPort(index, "draft_aft", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Departure Draft Fore (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.draft_fore}
                      onChange={(e) => updateLoadingPort(index, "draft_fore", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">BL Tarihi</Label>
                    <Input
                      type="date"
                      value={port.bl_date}
                      onChange={(e) => updateLoadingPort(index, "bl_date", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4 dark:bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500">
              <Anchor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Tahliye Limanları</h3>
              <p className="text-sm text-muted-foreground">Tahliye yapılacak limanları ekleyin</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addDischargePort} className="gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Liman Ekle
          </Button>
        </div>

        {dischargePorts.map((port, index) => (
          <Card key={index} className="border-purple-200 dark:border-purple-900">
            <CardHeader className="bg-purple-50/50 dark:bg-purple-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <CardTitle className="text-base">Tahliye Limanı {index + 1}</CardTitle>
                </div>
                {dischargePorts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDischargePort(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Same structure as loading ports but with discharge-specific styling */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Anchor className="h-4 w-4" />
                  Liman ve Kargo Bilgileri
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Liman Adı</Label>
                    <Input
                      value={port.port_name}
                      onChange={(e) => updateDischargePort(index, "port_name", e.target.value)}
                      placeholder="Liman adını giriniz"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Kargo Miktarı</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={port.cargo_quantity}
                        onChange={(e) => updateDischargePort(index, "cargo_quantity", e.target.value)}
                        placeholder="0.00"
                        className="h-10 flex-1"
                      />
                      <Select
                        value={port.cargo_unit}
                        onValueChange={(value) => updateDischargePort(index, "cargo_unit", value)}
                      >
                        <SelectTrigger className="h-10 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="BBL">BBL</SelectItem>
                          <SelectItem value="CBM">CBM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Tarih Bilgileri
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-sm">ATA</Label>
                    <Input
                      type="date"
                      value={port.ata}
                      onChange={(e) => updateDischargePort(index, "ata", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ATB</Label>
                    <Input
                      type="date"
                      value={port.atb}
                      onChange={(e) => updateDischargePort(index, "atb", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ATC</Label>
                    <Input
                      type="date"
                      value={port.atc}
                      onChange={(e) => updateDischargePort(index, "atc", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ATD</Label>
                    <Input
                      type="date"
                      value={port.atd}
                      onChange={(e) => updateDischargePort(index, "atd", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Fuel className="h-4 w-4" />
                  Yakıt ROB Değerleri
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Varış ROB FO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.arrival_rob_fo}
                      onChange={(e) => updateDischargePort(index, "arrival_rob_fo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Varış ROB MGO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.arrival_rob_mgo}
                      onChange={(e) => updateDischargePort(index, "arrival_rob_mgo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Kalkış ROB FO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.departure_rob_fo}
                      onChange={(e) => updateDischargePort(index, "departure_rob_fo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Kalkış ROB MGO (MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.departure_rob_mgo}
                      onChange={(e) => updateDischargePort(index, "departure_rob_mgo", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Yakıt Fiyatları
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">FO Fiyatı (USD/MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Yakıt fiyatı giriniz"
                      value={port.fo_price}
                      onChange={(e) => updateDischargePort(index, "fo_price", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">MGO Fiyatı (USD/MT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Yakıt fiyatı giriniz"
                      value={port.mgo_price}
                      onChange={(e) => updateDischargePort(index, "mgo_price", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2 rounded-lg bg-muted/50 p-3">
                  <Checkbox
                    id={`bunker-supply-discharge-${index}`}
                    checked={port.bunker_supply}
                    onCheckedChange={(checked) => updateDischargePort(index, "bunker_supply", checked === true)}
                  />
                  <Label htmlFor={`bunker-supply-discharge-${index}`} className="cursor-pointer font-medium">
                    Bunker İkmali Yapıldı
                  </Label>
                </div>

                {port.bunker_supply && (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Bunker FO (MT)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={port.bunker_fo}
                          onChange={(e) => updateDischargePort(index, "bunker_fo", e.target.value)}
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Bunker MGO (MT)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={port.bunker_mgo}
                          onChange={(e) => updateDischargePort(index, "bunker_mgo", e.target.value)}
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Diğer Bilgiler
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Departure Draft Aft (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.draft_aft}
                      onChange={(e) => updateDischargePort(index, "draft_aft", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Departure Draft Fore (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={port.draft_fore}
                      onChange={(e) => updateDischargePort(index, "draft_fore", e.target.value)}
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Genel Notlar</CardTitle>
          <CardDescription>Sefer hakkında ek bilgiler ekleyebilirsiniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={voyage?.notes}
            placeholder="Sefer ile ilgili notlarınızı buraya yazabilirsiniz..."
            className="resize-none"
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1 h-12 text-base font-medium" size="lg">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {voyage ? "Güncelleniyor..." : "Ekleniyor..."}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              {voyage ? "Seferi Güncelle" : "Sefer Ekle"}
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
