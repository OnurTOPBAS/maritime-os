"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"
import { DataLabel } from "@/components/data-label"
import { Badge } from "@/components/ui/badge"

interface VoyageActivitiesSectionProps {
  voyageId: string
  activities: any[]
  onUpdate: () => void
}

const OPERATION_TYPES = [
  "At Sea Laden",
  "At Sea Ballast",
  "Loading",
  "Discharge",
  "Waiting",
  "Idle",
  "Port Operations",
  "Bunkering",
  "Deviation",
  "Anchorage",
  "Other",
]

export function VoyageActivitiesSection({ voyageId, activities, onUpdate }: VoyageActivitiesSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    operation_type: "",
    port_name: "",
    days: "",
    fo_consumption_rate: "",
    mgo_consumption_rate: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `/api/voyage-account/${voyageId}/activities/${editingId}`
        : `/api/voyage-account/${voyageId}/activities`

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          days: Number.parseFloat(formData.days),
          fo_consumption_rate: formData.fo_consumption_rate ? Number.parseFloat(formData.fo_consumption_rate) : null,
          mgo_consumption_rate: formData.mgo_consumption_rate ? Number.parseFloat(formData.mgo_consumption_rate) : null,
        }),
      })

      if (response.ok) {
        setIsAdding(false)
        setEditingId(null)
        setFormData({
          operation_type: "",
          port_name: "",
          days: "",
          fo_consumption_rate: "",
          mgo_consumption_rate: "",
          notes: "",
        })
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Save activity error:", error)
    }
  }

  const handleEdit = (activity: any) => {
    setEditingId(activity.id)
    setFormData({
      operation_type: activity.operation_type,
      port_name: activity.port_name || "",
      days: activity.days.toString(),
      fo_consumption_rate: activity.fo_consumption_rate?.toString() || "",
      mgo_consumption_rate: activity.mgo_consumption_rate?.toString() || "",
      notes: activity.notes || "",
    })
    setIsAdding(true)
  }

  const handleDelete = async (activityId: string) => {
    if (!confirm("Bu operasyonu silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyage-account/${voyageId}/activities/${activityId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Delete activity error:", error)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      operation_type: "",
      port_name: "",
      days: "",
      fo_consumption_rate: "",
      mgo_consumption_rate: "",
      notes: "",
    })
  }

  const calculateConsumption = (rate: string, days: string) => {
    const r = Number.parseFloat(rate)
    const d = Number.parseFloat(days)
    if (!r || !d) return 0
    return r * d
  }

  const foConsumption = calculateConsumption(formData.fo_consumption_rate, formData.days)
  const mgoConsumption = calculateConsumption(formData.mgo_consumption_rate, formData.days)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Operasyon Kalemleri</CardTitle>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Operasyon Ekle
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operation_type">Operasyon Tipi *</Label>
                  <Select
                    value={formData.operation_type}
                    onValueChange={(value) => setFormData({ ...formData, operation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port_name">Liman Adı</Label>
                  <Input
                    id="port_name"
                    value={formData.port_name}
                    onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Gün Sayısı *</Label>
                  <Input
                    id="days"
                    type="number"
                    step="0.01"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fo_consumption_rate">FO Tüketim Oranı (MT/gün)</Label>
                  <Input
                    id="fo_consumption_rate"
                    type="number"
                    step="0.01"
                    value={formData.fo_consumption_rate}
                    onChange={(e) => setFormData({ ...formData, fo_consumption_rate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mgo_consumption_rate">MGO Tüketim Oranı (MT/gün)</Label>
                  <Input
                    id="mgo_consumption_rate"
                    type="number"
                    step="0.01"
                    value={formData.mgo_consumption_rate}
                    onChange={(e) => setFormData({ ...formData, mgo_consumption_rate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hesaplanan Tüketim</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                    <span className="text-sm">
                      FO: {foConsumption.toFixed(2)} MT | MGO: {mgoConsumption.toFixed(2)} MT
                    </span>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notlar</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

          {activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{activity.operation_type}</Badge>
                          {activity.port_name && (
                            <span className="text-sm text-muted-foreground">@ {activity.port_name}</span>
                          )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <DataLabel label="Gün" value={`${activity.days?.toFixed(2) || "0.00"}`} />
                          <DataLabel
                            label="FO Tüketimi"
                            value={`${activity.fo_consumption?.toFixed(2) || "0.00"} MT`}
                          />
                          <DataLabel
                            label="MGO Tüketimi"
                            value={`${activity.mgo_consumption?.toFixed(2) || "0.00"} MT`}
                          />
                          <DataLabel
                            label="FO Oranı"
                            value={activity.fo_consumption_rate ? `${activity.fo_consumption_rate} MT/gün` : "-"}
                          />
                        </div>
                        {activity.notes && <p className="text-sm text-muted-foreground">{activity.notes}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(activity)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(activity.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Henüz operasyon eklenmemiş</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
