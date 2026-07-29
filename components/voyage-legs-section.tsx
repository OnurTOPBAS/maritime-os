"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"
import { DataLabel } from "@/components/data-label"

interface VoyageLegsSectionProps {
  voyageId: string
  legs: any[]
  onUpdate: () => void
}

export function VoyageLegsSection({ voyageId, legs, onUpdate }: VoyageLegsSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    from_port: "",
    to_port: "",
    distance_nm: "",
    cargo_type: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `/api/voyage-account/${voyageId}/legs/${editingId}`
        : `/api/voyage-account/${voyageId}/legs`

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          distance_nm: Number.parseFloat(formData.distance_nm),
        }),
      })

      if (response.ok) {
        setIsAdding(false)
        setEditingId(null)
        setFormData({ from_port: "", to_port: "", distance_nm: "", cargo_type: "" })
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Save leg error:", error)
    }
  }

  const handleEdit = (leg: any) => {
    setEditingId(leg.id)
    setFormData({
      from_port: leg.from_port || "",
      to_port: leg.to_port || "",
      distance_nm: leg.distance_nm ? leg.distance_nm.toString() : "",
      cargo_type: leg.cargo_type || "",
    })
    setIsAdding(true)
  }

  const handleDelete = async (legId: string) => {
    if (!confirm("Bu rota bacağını silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyage-account/${voyageId}/legs/${legId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Delete leg error:", error)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ from_port: "", to_port: "", distance_nm: "", cargo_type: "" })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rota Bacakları</CardTitle>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Bacak Ekle
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from_port">Başlangıç Limanı *</Label>
                  <Input
                    id="from_port"
                    value={formData.from_port}
                    onChange={(e) => setFormData({ ...formData, from_port: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_port">Varış Limanı *</Label>
                  <Input
                    id="to_port"
                    value={formData.to_port}
                    onChange={(e) => setFormData({ ...formData, to_port: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance_nm">Mesafe (NM) *</Label>
                  <Input
                    id="distance_nm"
                    type="number"
                    step="0.01"
                    value={formData.distance_nm}
                    onChange={(e) => setFormData({ ...formData, distance_nm: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo_type">Kargo Tipi</Label>
                  <Input
                    id="cargo_type"
                    value={formData.cargo_type}
                    onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
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

          {legs && legs.length > 0 ? (
            <div className="space-y-3">
              {legs.map((leg) => (
                <Card key={leg.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{leg.from_port}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-lg font-semibold">{leg.to_port}</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <DataLabel label="Mesafe" value={`${leg.distance_nm || 0} NM`} />
                          <DataLabel label="Deniz Günü" value={`${leg.sea_days?.toFixed(2) || "0.00"} gün`} />
                          {leg.cargo_type && <DataLabel label="Kargo" value={leg.cargo_type} />}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(leg)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(leg.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Henüz rota bacağı eklenmemiş</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
