"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, Save, X, TrendingUp } from "lucide-react"

interface VoyageRevenuesSectionProps {
  voyageId: string
  revenues: any[]
  onUpdate: () => void
}

export function VoyageRevenuesSection({ voyageId, revenues, onUpdate }: VoyageRevenuesSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    revenue_type: "",
    description: "",
    amount: "",
    currency: "USD",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `/api/voyage-account/${voyageId}/revenues/${editingId}`
        : `/api/voyage-account/${voyageId}/revenues`

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: Number.parseFloat(formData.amount),
        }),
      })

      if (response.ok) {
        setIsAdding(false)
        setEditingId(null)
        setFormData({ revenue_type: "", description: "", amount: "", currency: "USD" })
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Save revenue error:", error)
    }
  }

  const handleEdit = (revenue: any) => {
    setEditingId(revenue.id)
    setFormData({
      revenue_type: revenue.revenue_type,
      description: revenue.description || "",
      amount: revenue.amount.toString(),
      currency: revenue.currency || "USD",
    })
    setIsAdding(true)
  }

  const handleDelete = async (revenueId: string) => {
    if (!confirm("Bu gelir kalemini silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyage-account/${voyageId}/revenues/${revenueId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Delete revenue error:", error)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ revenue_type: "", description: "", amount: "", currency: "USD" })
  }

  const totalRevenues = revenues?.reduce((sum, revenue) => sum + (revenue.amount || 0), 0) || 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Gelir Kalemleri
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Toplam: <span className="font-semibold text-green-600">${totalRevenues.toLocaleString()}</span>
            </p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Gelir Ekle
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="revenue_type">Gelir Tipi *</Label>
                  <Input
                    id="revenue_type"
                    value={formData.revenue_type}
                    onChange={(e) => setFormData({ ...formData, revenue_type: e.target.value })}
                    placeholder="Örn: Freight, Demurrage, Dispatch"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Tutar *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
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

          {revenues && revenues.length > 0 ? (
            <div className="space-y-3">
              {revenues.map((revenue) => (
                <Card key={revenue.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-lg">{revenue.revenue_type}</span>
                          <span className="text-xl font-bold text-green-600">${revenue.amount.toLocaleString()}</span>
                        </div>
                        {revenue.description && <p className="text-sm text-muted-foreground">{revenue.description}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(revenue)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(revenue.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Henüz gelir kalemi eklenmemiş</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
