"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Fleet {
  id?: string
  company_id?: string
  name: string
  description: string
}

interface FleetFormProps {
  companyId: string
  fleet?: Fleet
  onSuccess: (fleet: any) => void
}

export function FleetForm({ companyId, fleet, onSuccess }: FleetFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: fleet?.name || "",
    description: fleet?.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = fleet ? `/api/fleets/${fleet.id}` : "/api/fleets"
      const method = fleet ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess(fleet ? data : data.fleet)
        if (!fleet) {
          setFormData({ name: "", description: "" })
        }
      }
    } catch (error) {
      console.error("[v0] Fleet form error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Filo Adı *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
          placeholder="Örn: Tanker Filosu"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
          rows={3}
          placeholder="Filo hakkında kısa açıklama"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (fleet ? "Güncelleniyor..." : "Oluşturuluyor...") : fleet ? "Güncelle" : "Filo Oluştur"}
      </Button>
    </form>
  )
}
