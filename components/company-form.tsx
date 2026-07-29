"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CompanyFormProps {
  onSuccess: (company: any) => void
}

export function CompanyForm({ onSuccess }: CompanyFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    tax_number: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess(data.company)
        setFormData({ name: "", address: "", phone: "", email: "", tax_number: "" })
      }
    } catch (error) {
      console.error("[v0] Create company error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Şirket Adı *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adres</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          disabled={loading}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tax_number">Vergi Numarası</Label>
        <Input
          id="tax_number"
          value={formData.tax_number}
          onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Oluşturuluyor..." : "Şirket Oluştur"}
      </Button>
    </form>
  )
}
