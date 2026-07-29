"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface BankAccount {
  id?: string
  bank_id?: string
  account_name: string
  account_number: string
  currency: string
  iban?: string
  account_type?: string
  is_active: boolean
  notes?: string
}

interface BankAccountFormProps {
  bankId: string
  account?: BankAccount
  onSuccess: (account: BankAccount) => void
}

export function BankAccountForm({ bankId, account, onSuccess }: BankAccountFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BankAccount>({
    account_name: account?.account_name || "",
    account_number: account?.account_number || "",
    currency: account?.currency || "USD",
    iban: account?.iban || "",
    account_type: account?.account_type || "",
    is_active: account?.is_active !== false,
    notes: account?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = account ? `/api/bank-accounts/${account.id}` : "/api/bank-accounts"
      const method = account ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankId,
          accountName: formData.account_name,
          accountNumber: formData.account_number,
          currency: formData.currency,
          iban: formData.iban,
          accountType: formData.account_type,
          isActive: formData.is_active,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess(data)
      }
    } catch (error) {
      console.error("[v0] Account form error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account_name">Hesap Adı *</Label>
          <Input
            id="account_name"
            value={formData.account_name}
            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_number">Hesap Numarası *</Label>
          <Input
            id="account_number"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency">Para Birimi</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="TRY">TRY</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_type">Hesap Tipi</Label>
          <Input
            id="account_type"
            value={formData.account_type}
            onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
            placeholder="Örn: Vadesiz, Vadeli"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="iban">IBAN</Label>
        <Input id="iban" value={formData.iban} onChange={(e) => setFormData({ ...formData, iban: e.target.value })} />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Aktif Hesap</Label>
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
        {loading ? "Kaydediliyor..." : account ? "Güncelle" : "Hesap Ekle"}
      </Button>
    </form>
  )
}
