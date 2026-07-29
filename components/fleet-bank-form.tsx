"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FleetBank {
  id?: string
  fleet_id?: string
  bank_name: string
  bank_code?: string
  swift_code?: string
  branch_name?: string
  branch_address?: string
  relationship_manager_name?: string
  relationship_manager_email?: string
  relationship_manager_phone?: string
  notes?: string
}

interface FleetBankFormProps {
  fleetId: string
  bank?: FleetBank
  onSuccess: (bank: FleetBank) => void
}

export function FleetBankForm({ fleetId, bank, onSuccess }: FleetBankFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FleetBank>({
    bank_name: bank?.bank_name || "",
    bank_code: bank?.bank_code || "",
    swift_code: bank?.swift_code || "",
    branch_name: bank?.branch_name || "",
    branch_address: bank?.branch_address || "",
    relationship_manager_name: bank?.relationship_manager_name || "",
    relationship_manager_email: bank?.relationship_manager_email || "",
    relationship_manager_phone: bank?.relationship_manager_phone || "",
    notes: bank?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = bank ? `/api/fleet-banks/${bank.id}` : "/api/fleet-banks"
      const method = bank ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleetId,
          bankName: formData.bank_name,
          bankCode: formData.bank_code,
          swiftCode: formData.swift_code,
          branchName: formData.branch_name,
          branchAddress: formData.branch_address,
          relationshipManagerName: formData.relationship_manager_name,
          relationshipManagerEmail: formData.relationship_manager_email,
          relationshipManagerPhone: formData.relationship_manager_phone,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess(data)
      }
    } catch (error) {
      console.error("[v0] Bank form error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank_name">Banka Adı *</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_code">Banka Kodu</Label>
          <Input
            id="bank_code"
            value={formData.bank_code}
            onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="swift_code">SWIFT Kodu</Label>
          <Input
            id="swift_code"
            value={formData.swift_code}
            onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch_name">Şube Adı</Label>
          <Input
            id="branch_name"
            value={formData.branch_name}
            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branch_address">Şube Adresi</Label>
        <Textarea
          id="branch_address"
          value={formData.branch_address}
          onChange={(e) => setFormData({ ...formData, branch_address: e.target.value })}
          rows={2}
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4">İlişki Yöneticisi Bilgileri</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rm_name">Ad Soyad</Label>
            <Input
              id="rm_name"
              value={formData.relationship_manager_name}
              onChange={(e) => setFormData({ ...formData, relationship_manager_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rm_email">E-posta</Label>
            <Input
              id="rm_email"
              type="email"
              value={formData.relationship_manager_email}
              onChange={(e) => setFormData({ ...formData, relationship_manager_email: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="rm_phone">Telefon</Label>
          <Input
            id="rm_phone"
            value={formData.relationship_manager_phone}
            onChange={(e) => setFormData({ ...formData, relationship_manager_phone: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Kaydediliyor..." : bank ? "Güncelle" : "Banka Ekle"}
      </Button>
    </form>
  )
}
