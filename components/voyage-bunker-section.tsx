"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit2, Save, X, Fuel } from "lucide-react"
import { DataLabel } from "@/components/data-label"
import { Badge } from "@/components/ui/badge"

interface VoyageBunkerSectionProps {
  voyageId: string
  bunkerPrices: any[]
  onUpdate: () => void
}

export function VoyageBunkerSection({ voyageId, bunkerPrices, onUpdate }: VoyageBunkerSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fuel_type: "",
    price_per_ton: "",
    port_name: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `/api/voyage-account/${voyageId}/bunker-prices/${editingId}`
        : `/api/voyage-account/${voyageId}/bunker-prices`

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price_per_ton: Number.parseFloat(formData.price_per_ton),
        }),
      })

      if (response.ok) {
        setIsAdding(false)
        setEditingId(null)
        setFormData({ fuel_type: "", price_per_ton: "", port_name: "", date: new Date().toISOString().split("T")[0] })
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Save bunker price error:", error)
    }
  }

  const handleEdit = (price: any) => {
    setEditingId(price.id)
    setFormData({
      fuel_type: price.fuel_type,
      price_per_ton: price.price_per_ton.toString(),
      port_name: price.port_name || "",
      date: price.date ? new Date(price.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    })
    setIsAdding(true)
  }

  const handleDelete = async (priceId: string) => {
    if (!confirm("Bu yakıt fiyatını silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyage-account/${voyageId}/bunker-prices/${priceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Delete bunker price error:", error)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ fuel_type: "", price_per_ton: "", port_name: "", date: new Date().toISOString().split("T")[0] })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Yakıt Fiyatları
          </CardTitle>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Fiyat Ekle
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fuel_type">Yakıt Tipi *</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FO">FO (Fuel Oil)</SelectItem>
                      <SelectItem value="MGO">MGO (Marine Gas Oil)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_ton">Fiyat ($/MT) *</Label>
                  <Input
                    id="price_per_ton"
                    type="number"
                    step="0.01"
                    value={formData.price_per_ton}
                    onChange={(e) => setFormData({ ...formData, price_per_ton: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port_name">Liman</Label>
                  <Input
                    id="port_name"
                    value={formData.port_name}
                    onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tarih</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? "Güncelle" : "Kaydet"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
              </div>
            </form>
          )}

          {bunkerPrices && bunkerPrices.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {bunkerPrices.map((price) => (
                <Card key={price.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={price.fuel_type === "FO" ? "default" : "secondary"}>{price.fuel_type}</Badge>
                          <span className="text-2xl font-bold">${price.price_per_ton}/MT</span>
                        </div>
                        <div className="grid gap-2">
                          {price.port_name && <DataLabel label="Liman" value={price.port_name} />}
                          {price.date && (
                            <DataLabel label="Tarih" value={new Date(price.date).toLocaleDateString("tr-TR")} />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(price)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(price.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Henüz yakıt fiyatı eklenmemiş</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
