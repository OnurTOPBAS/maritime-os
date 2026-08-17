"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShipFuelConsumptionForm } from "@/components/ship-fuel-consumption-form"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ShipFormProps {
  fleetId: string
  onSuccess: (ship: any) => void
  ship?: any
}

const defaultConsumptionOperations = {
  loading: { fo: 0, mgo: 0 },
  discharge: { fo: 0, mgo: 0 },
  laden: { fo: 0, mgo: 0 },
  ballast: { fo: 0, mgo: 0 },
  anchor: { fo: 0, mgo: 0 },
  idle: { fo: 0, mgo: 0 },
  inerting: { fo: 0, mgo: 0 },
  washing: { fo: 0, mgo: 0 },
  heating: { fo: 0, mgo: 0 },
  incinerator: { fo: 0, mgo: 0 },
}

export function ShipForm({ fleetId, onSuccess, ship }: ShipFormProps) {
  const [loading, setLoading] = useState(false)
  const [particularsFile, setParticularsFile] = useState<File | null>(null)
  const [particularsUrl, setParticularsUrl] = useState<string | null>(ship?.particulars_file_url || null)
  const [uploadingParticulars, setUploadingParticulars] = useState(false)

  const [fuelConsumptionFile, setFuelConsumptionFile] = useState<File | null>(null)
  const [fuelConsumptionUrl, setFuelConsumptionUrl] = useState<string | null>(ship?.fuel_consumption_file_url || null)
  const [uploadingFuelConsumption, setUploadingFuelConsumption] = useState(false)

  const [availableFleets, setAvailableFleets] = useState<any[]>([])
  const [selectedFleetId, setSelectedFleetId] = useState(fleetId)

  const [formData, setFormData] = useState({
    name: "",
    imo_number: "",
    flag: "",
    vessel_type: "",
    dwt: "",
    built_year: "",
    status: "active",
    grt: "",
    nrt: "",
    main_engine: "",
    engine_power: "",
    speed_laden: "",
    speed_ballast: "",
    loa: "",
    beam: "",
    draft: "",
    current_position: "",
    latitude: "",
    longitude: "",
  })

  const [fuelConsumption, setFuelConsumption] = useState({
    operations: defaultConsumptionOperations,
  })

  useEffect(() => {
    if (ship) {
      setFormData({
        name: ship.name || "",
        imo_number: ship.imo_number || "",
        flag: ship.flag || "",
        vessel_type: ship.vessel_type || "",
        dwt: ship.dwt?.toString() || "",
        built_year: ship.built_year?.toString() || "",
        status: ship.status || "active",
        grt: ship.grt?.toString() || "",
        nrt: ship.nrt?.toString() || "",
        main_engine: ship.main_engine || "",
        engine_power: ship.engine_power || "",
        speed_laden: ship.speed_laden?.toString() || "",
        speed_ballast: ship.speed_ballast?.toString() || "",
        loa: ship.loa?.toString() || "",
        beam: ship.beam?.toString() || "",
        draft: ship.draft?.toString() || "",
        current_position: ship.current_position || "",
        latitude: ship.latitude?.toString() || "",
        longitude: ship.longitude?.toString() || "",
      })

      setFuelConsumption({
        operations: ship.consumption_operations || defaultConsumptionOperations,
      })

      setParticularsUrl(ship.particulars_file_url || null)
      setFuelConsumptionUrl(ship.fuel_consumption_file_url || null)

      // Fetch available fleets for fleet change
      const fetchFleets = async () => {
        try {
          const response = await fetch("/api/fleets")
          if (response.ok) {
            const data = await response.json()
            setAvailableFleets(data.fleets || [])
          }
        } catch (error) {
          console.error("[v0] Fetch fleets error:", error)
        }
      }
      fetchFleets()
    }
  }, [ship])

  const handleParticularsUpload = async () => {
    if (!particularsFile) return

    setUploadingParticulars(true)
    try {
      const formData = new FormData()
      formData.append("file", particularsFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setParticularsUrl(data.url)
        setParticularsFile(null)
      }
    } catch (error) {
      console.error("[v0] File upload error:", error)
      alert("Dosya yüklenirken hata oluştu")
    } finally {
      setUploadingParticulars(false)
    }
  }

  const handleFuelConsumptionUpload = async () => {
    if (!fuelConsumptionFile) return

    setUploadingFuelConsumption(true)
    try {
      const formData = new FormData()
      formData.append("file", fuelConsumptionFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFuelConsumptionUrl(data.url)
        setFuelConsumptionFile(null)
      }
    } catch (error) {
      console.error("[v0] File upload error:", error)
      alert("Dosya yüklenirken hata oluştu")
    } finally {
      setUploadingFuelConsumption(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Ship form submit started", { fleetId: selectedFleetId, formData })
    setLoading(true)

    try {
      const url = ship ? `/api/ships/${ship.id}` : "/api/ships"
      const method = ship ? "PUT" : "POST"

      const payload = {
        fleet_id: selectedFleetId, // Use selected fleet ID instead of prop
        name: formData.name,
        imo_number: formData.imo_number || null,
        flag: formData.flag || null,
        vessel_type: formData.vessel_type || null,
        dwt: formData.dwt ? Number.parseFloat(formData.dwt) : null,
        built_year: formData.built_year ? Number.parseInt(formData.built_year) : null,
        status: formData.status,
        grt: formData.grt ? Number.parseFloat(formData.grt) : null,
        nrt: formData.nrt ? Number.parseFloat(formData.nrt) : null,
        main_engine: formData.main_engine || null,
        engine_power: formData.engine_power || null,
        speed_laden: formData.speed_laden ? Number.parseFloat(formData.speed_laden) : null,
        speed_ballast: formData.speed_ballast ? Number.parseFloat(formData.speed_ballast) : null,
        loa: formData.loa ? Number.parseFloat(formData.loa) : null,
        beam: formData.beam ? Number.parseFloat(formData.beam) : null,
        draft: formData.draft ? Number.parseFloat(formData.draft) : null,
        current_position: formData.current_position || null,
        latitude: formData.latitude ? Number.parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? Number.parseFloat(formData.longitude) : null,
        position_updated_at: formData.latitude || formData.longitude ? new Date().toISOString() : null,
        consumption_operations: fuelConsumption.operations,
        consumption_laden_speed: null,
        consumption_ballast_speed: null,
        particulars_file_url: particularsUrl,
        fuel_consumption_file_url: fuelConsumptionUrl, // Added fuel consumption file URL
      }

      console.log("[v0] Sending ship data:", payload)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] Ship save response:", { ok: response.ok, status: response.status, data })

      if (response.ok) {
        onSuccess(data.ship)
        if (!ship) {
          // Reset form
          setFormData({
            name: "",
            imo_number: "",
            flag: "",
            vessel_type: "",
            dwt: "",
            built_year: "",
            status: "active",
            grt: "",
            nrt: "",
            main_engine: "",
            engine_power: "",
            speed_laden: "",
            speed_ballast: "",
            loa: "",
            beam: "",
            draft: "",
            current_position: "",
            latitude: "",
            longitude: "",
          })
          setFuelConsumption({
            operations: defaultConsumptionOperations,
          })
          setParticularsUrl(null)
          setParticularsFile(null)
          setFuelConsumptionUrl(null)
          setFuelConsumptionFile(null)
        }
      } else {
        console.error("[v0] Ship save failed:", data)
        // Doğrulama hataları { errors: [{field, message}] } biçiminde gelir;
        // kullanıcıya hangi alanın hatalı olduğunu göster.
        const msg = Array.isArray(data.errors)
          ? data.errors.map((e: any) => e.message).join("\n")
          : data.error || "Gemi kaydedilemedi"
        alert(msg)
      }
    } catch (error) {
      console.error("[v0] Save ship error:", error)
      alert("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
          <TabsTrigger value="technical">Teknik Özellikler</TabsTrigger>
          <TabsTrigger value="fuel">Yakıt Tüketimi</TabsTrigger>
          <TabsTrigger value="position">Pozisyon</TabsTrigger>
        </TabsList>

        <div className="max-h-[60vh] overflow-y-auto">
          <TabsContent value="basic" className="space-y-4">
            {ship && availableFleets.length > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
                <Label htmlFor="fleet_id">Filo Değiştir</Label>
                <Select value={selectedFleetId} onValueChange={setSelectedFleetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filo seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFleets.map((fleet) => (
                      <SelectItem key={fleet.id} value={fleet.id}>
                        {fleet.name} ({fleet.company_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Gemiyi farklı bir filoya taşıyabilirsiniz</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Gemi Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  placeholder="Örn: MV OCEAN STAR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imo_number">IMO Numarası</Label>
                <Input
                  id="imo_number"
                  value={formData.imo_number}
                  onChange={(e) => setFormData({ ...formData, imo_number: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: IMO 9123456"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vessel_type">Gemi Tipi</Label>
                <Input
                  id="vessel_type"
                  value={formData.vessel_type}
                  onChange={(e) => setFormData({ ...formData, vessel_type: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: Bulk Carrier, Tanker"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flag">Bayrak</Label>
                <Input
                  id="flag"
                  value={formData.flag}
                  onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: Panama, Marshall Islands"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dwt">DWT (Deadweight Tonnage)</Label>
                <Input
                  id="dwt"
                  type="number"
                  step="0.01"
                  value={formData.dwt}
                  onChange={(e) => setFormData({ ...formData, dwt: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 75000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="built_year">İnşa Yılı</Label>
                <Input
                  id="built_year"
                  type="number"
                  value={formData.built_year}
                  onChange={(e) => setFormData({ ...formData, built_year: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 2015"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="maintenance">Bakımda</SelectItem>
                  <SelectItem value="idle">Boşta (Idle)</SelectItem>
                  <SelectItem value="anchored">Demirde</SelectItem>
                  <SelectItem value="in_port">Limanda</SelectItem>
                  <SelectItem value="at_sea">Seferde (At Sea)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grt">GRT (Gross Register Tonnage)</Label>
                <Input
                  id="grt"
                  type="number"
                  step="0.01"
                  value={formData.grt}
                  onChange={(e) => setFormData({ ...formData, grt: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 45000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nrt">NRT (Net Register Tonnage)</Label>
                <Input
                  id="nrt"
                  type="number"
                  step="0.01"
                  value={formData.nrt}
                  onChange={(e) => setFormData({ ...formData, nrt: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 25000"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="main_engine">Ana Makine</Label>
                <Input
                  id="main_engine"
                  value={formData.main_engine}
                  onChange={(e) => setFormData({ ...formData, main_engine: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: MAN B&W 6S50MC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engine_power">Makine Gücü</Label>
                <Input
                  id="engine_power"
                  value={formData.engine_power}
                  onChange={(e) => setFormData({ ...formData, engine_power: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 9,480 kW"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="speed_laden">Hız (Yüklü) - Knots</Label>
                <Input
                  id="speed_laden"
                  type="number"
                  step="0.1"
                  value={formData.speed_laden}
                  onChange={(e) => setFormData({ ...formData, speed_laden: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 14.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed_ballast">Hız (Balast) - Knots</Label>
                <Input
                  id="speed_ballast"
                  type="number"
                  step="0.1"
                  value={formData.speed_ballast}
                  onChange={(e) => setFormData({ ...formData, speed_ballast: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 15.0"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="loa">LOA (Uzunluk) - m</Label>
                <Input
                  id="loa"
                  type="number"
                  step="0.01"
                  value={formData.loa}
                  onChange={(e) => setFormData({ ...formData, loa: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 225.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beam">Genişlik - m</Label>
                <Input
                  id="beam"
                  type="number"
                  step="0.01"
                  value={formData.beam}
                  onChange={(e) => setFormData({ ...formData, beam: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 32.26"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="draft">Draft (Derinlik) - m</Label>
                <Input
                  id="draft"
                  type="number"
                  step="0.01"
                  value={formData.draft}
                  onChange={(e) => setFormData({ ...formData, draft: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 14.50"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Ship Particulars Dosyası</Label>
              <p className="text-sm text-muted-foreground">Gemi teknik özellikler dökümanı (PDF, Excel, vb.)</p>

              {particularsUrl ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Yüklü Dosya</p>
                          <a
                            href={particularsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Dosyayı Görüntüle →
                          </a>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setParticularsUrl(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) => setParticularsFile(e.target.files?.[0] || null)}
                    disabled={uploadingParticulars}
                  />
                  <Button
                    type="button"
                    onClick={handleParticularsUpload}
                    disabled={!particularsFile || uploadingParticulars}
                  >
                    {uploadingParticulars ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fuel" className="space-y-4">
            <ShipFuelConsumptionForm operations={fuelConsumption.operations} onChange={setFuelConsumption} />

            <div className="space-y-2 pt-4 border-t">
              <Label>Yakıt Tüketim Dökümanı</Label>
              <p className="text-sm text-muted-foreground">Yakıt tüketim raporu (PDF, Excel, vb.)</p>

              {fuelConsumptionUrl ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium">Yüklü Dosya</p>
                          <a
                            href={fuelConsumptionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Dosyayı Görüntüle →
                          </a>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFuelConsumptionUrl(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) => setFuelConsumptionFile(e.target.files?.[0] || null)}
                    disabled={uploadingFuelConsumption}
                  />
                  <Button
                    type="button"
                    onClick={handleFuelConsumptionUpload}
                    disabled={!fuelConsumptionFile || uploadingFuelConsumption}
                  >
                    {uploadingFuelConsumption ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="position" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_position">Mevcut Pozisyon</Label>
              <Input
                id="current_position"
                value={formData.current_position}
                onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                disabled={loading}
                placeholder="Örn: İstanbul Boğazı, Türkiye"
              />
              <p className="text-xs text-muted-foreground">
                Manuel olarak konum girebilir veya aşağıda koordinat belirtebilirsiniz
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Enlem (Latitude)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 41.0082"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Boylam (Longitude)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  disabled={loading}
                  placeholder="Örn: 28.9784"
                />
              </div>
            </div>

            {formData.latitude && formData.longitude && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Koordinat Önizleme:</p>
                <p className="text-sm text-muted-foreground">
                  {formData.latitude}°, {formData.longitude}°
                </p>
                <a
                  href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Google Maps'te Görüntüle →
                </a>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (ship ? "Güncelleniyor..." : "Ekleniyor...") : ship ? "Güncelle" : "Gemi Ekle"}
      </Button>
    </form>
  )
}
