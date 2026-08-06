"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Ship, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { PortSearchInput } from "@/components/port-search-input"

interface VoyageCalculatorStep2Props {
  calculationId: string
  calculation: any
  onComplete: () => void
}

interface RouteLeg {
  id?: string
  from_port: string
  to_port: string
  distance_nm: number
  leg_condition: "laden" | "ballast"
  sea_days?: number
  fo_consumption?: number
  mgo_consumption?: number
}

interface Port {
  id: string
  port_name: string
  country_iso: string
  country_name: string
  unlocode: string
  port_type: string
  lat: number
  lon: number
}

export function VoyageCalculatorStep2({ calculationId, calculation, onComplete }: VoyageCalculatorStep2Props) {
  const { toast } = useToast()
  const [legs, setLegs] = useState<RouteLeg[]>([])
  const [loading, setLoading] = useState(false)
  const [editingLeg, setEditingLeg] = useState<RouteLeg | null>(null)
  const [formData, setFormData] = useState<RouteLeg>({
    from_port: "",
    to_port: "",
    distance_nm: 0,
    leg_condition: "laden",
  })
  const [calculatingDistance, setCalculatingDistance] = useState(false)
  const [fromPortData, setFromPortData] = useState<Port | null>(null)
  const [toPortData, setToPortData] = useState<Port | null>(null)

  useEffect(() => {
    fetchLegs()
  }, [calculationId])

  useEffect(() => {
    if (fromPortData && toPortData && fromPortData.id !== toPortData.id) {
      calculateDistance(fromPortData, toPortData)
    }
  }, [fromPortData, toPortData])

  const calculateDistance = async (fromPort: Port, toPort: Port) => {
    if (!fromPort || !toPort || fromPort.id === toPort.id) {
      return
    }

    setCalculatingDistance(true)
    console.log("[v0] Using UUIDs:", fromPort.id, "to", toPort.id)

    try {
      const params = new URLSearchParams({
        fromUuid: fromPort.id,
        toUuid: toPort.id,
        fromUnlocode: fromPort.unlocode,
        toUnlocode: toPort.unlocode,
      })

      // NOT: /api/datalastic/distance uç noktası projede TANIMLI DEĞİL.
      // Bu çağrı 404 döner ve mesafe otomatik hesaplanamaz; kullanıcı
      // mesafeyi elle girebilir. Uç nokta eklenene kadar özellik eksiktir.
      const response = await fetch(`/api/datalastic/distance?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()

        let distance = null
        if (data.distance_nm) {
          distance = data.distance_nm
        } else if (data.data?.distance_nm) {
          distance = data.data.distance_nm
        } else if (data.data?.distance) {
          distance = data.data.distance
        }

        if (distance) {
          setFormData((prev) => ({ ...prev, distance_nm: distance }))
          toast({
            title: "Mesafe Hesaplandı",
            description: `${fromPort.port_name} - ${toPort.port_name}: ${distance.toFixed(1)} NM`,
          })
        } else {
          console.warn("[v0] Distance not found in response:", data)
          toast({
            title: "Uyarı",
            description: "Mesafe hesaplanamadı. Manuel olarak girebilirsiniz.",
            variant: "default",
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Distance calculation failed:", response.status, errorData)
        toast({
          title: "Mesafe Hesaplanamadı",
          description: "Lütfen mesafeyi manuel olarak girin.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("[v0] Error calculating distance:", error)
      toast({
        title: "Bağlantı Hatası",
        description: "Mesafe hesaplanamadı. Lütfen manuel olarak girin.",
        variant: "default",
      })
    } finally {
      setCalculatingDistance(false)
    }
  }

  const fetchLegs = async () => {
    try {
      const response = await fetch(`/api/voyage-calculator/${calculationId}/legs`)
      if (response.ok) {
        const data = await response.json()
        setLegs(data)
      }
    } catch (error) {
      console.error("Error fetching legs:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingLeg
        ? `/api/voyage-calculator/${calculationId}/legs/${editingLeg.id}`
        : `/api/voyage-calculator/${calculationId}/legs`

      const method = editingLeg ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: editingLeg ? "Rota bacağı güncellendi" : "Rota bacağı eklendi",
        })
        setFormData({
          from_port: "",
          to_port: "",
          distance_nm: 0,
          leg_condition: "laden",
        })
        setFromPortData(null)
        setToPortData(null)
        setEditingLeg(null)
        fetchLegs()
      } else {
        throw new Error("Failed to save leg")
      }
    } catch (error) {
      console.error("Error saving leg:", error)
      toast({
        title: "Hata",
        description: "Rota bacağı kaydedilemedi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (leg: RouteLeg) => {
    setEditingLeg(leg)
    setFormData({
      from_port: leg.from_port,
      to_port: leg.to_port,
      distance_nm: leg.distance_nm,
      leg_condition: leg.leg_condition,
    })
    setFromPortData(null)
    setToPortData(null)
  }

  const handleDelete = async (legId: string) => {
    if (!confirm("Bu rota bacağını silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyage-calculator/${calculationId}/legs/${legId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Rota bacağı silindi",
        })
        fetchLegs()
      }
    } catch (error) {
      console.error("Error deleting leg:", error)
      toast({
        title: "Hata",
        description: "Rota bacağı silinemedi",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingLeg(null)
    setFormData({
      from_port: "",
      to_port: "",
      distance_nm: 0,
      leg_condition: "laden",
    })
    setFromPortData(null)
    setToPortData(null)
  }

  const totalDistance = legs.reduce((sum, leg) => sum + (leg.distance_nm || 0), 0)
  const totalSeaDays = legs.reduce((sum, leg) => sum + (leg.sea_days || 0), 0)

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{editingLeg ? "Rota Bacağını Düzenle" : "Yeni Rota Bacağı Ekle"}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <PortSearchInput
                label="Çıkış Limanı"
                value={formData.from_port}
                onChange={(portName, portData) => {
                  setFormData({ ...formData, from_port: portName })
                  if (portData) {
                    setFromPortData(portData)
                  }
                }}
                placeholder="Örn: İstanbul"
              />

              <PortSearchInput
                label="Varış Limanı"
                value={formData.to_port}
                onChange={(portName, portData) => {
                  setFormData({ ...formData, to_port: portName })
                  if (portData) {
                    setToPortData(portData)
                  }
                }}
                placeholder="Örn: Rotterdam"
              />

              <div>
                <Label htmlFor="distance_nm">Mesafe (Deniz Mili)</Label>
                <div className="relative">
                  <Input
                    id="distance_nm"
                    type="number"
                    step="0.1"
                    value={formData.distance_nm || ""}
                    onChange={(e) => setFormData({ ...formData, distance_nm: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="Otomatik hesaplanacak"
                    required
                    disabled={calculatingDistance}
                  />
                  {calculatingDistance && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {calculation?.service_speed && formData.distance_nm > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tahmini deniz günü: {(formData.distance_nm / (calculation.service_speed * 24)).toFixed(2)} gün
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="leg_condition">Gemi Durumu</Label>
                <Select
                  value={formData.leg_condition}
                  onValueChange={(value: "laden" | "ballast") => setFormData({ ...formData, leg_condition: value })}
                >
                  <SelectTrigger id="leg_condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laden">Yüklü (Laden)</SelectItem>
                    <SelectItem value="ballast">Boş (Ballast)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Yakıt tüketimi hesaplamasında kullanılır</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || calculatingDistance}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? "Kaydediliyor..." : editingLeg ? "Güncelle" : "Hızlı Ekle"}
              </Button>
              {editingLeg && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Legs List */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Rota Bacakları</h3>
            </div>
            {legs.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Toplam: {legs.length} bacak, {totalDistance.toFixed(0)} NM, {totalSeaDays.toFixed(1)} gün
              </div>
            )}
          </div>

          {legs.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Henüz rota bacağı yok"
              description="Yukarıdaki formu kullanarak rota bacakları ekleyin"
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Çıkış</TableHead>
                    <TableHead>Varış</TableHead>
                    <TableHead className="text-right">Mesafe (NM)</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Deniz Günü</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {legs.map((leg, index) => (
                    <TableRow key={leg.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{leg.from_port}</TableCell>
                      <TableCell>{leg.to_port}</TableCell>
                      <TableCell className="text-right">{leg.distance_nm?.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge variant={leg.leg_condition === "laden" ? "default" : "secondary"}>
                          {leg.leg_condition === "laden" ? "Yüklü" : "Boş"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{leg.sea_days?.toFixed(2) || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(leg)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(leg.id!)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      {legs.length > 0 && (
        <div className="flex justify-end">
          <Button size="lg" onClick={onComplete}>
            Devam Et
          </Button>
        </div>
      )}
    </div>
  )
}
