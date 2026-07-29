"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

interface OfficePnlFormProps {
  record?: any
  reportMonth?: string
  onSuccess: () => void
  onCancel: () => void
}

const formatDate = (date: any): string => {
  if (!date) return ""
  if (typeof date === "string") return date.split("T")[0]
  if (date instanceof Date) return date.toISOString().split("T")[0]
  return String(date).split("T")[0]
}

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

function generateMonthOptions() {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  // Show 12 months back and 3 months forward
  for (let i = -12; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    options.push({ value, label })
  }
  return options
}

export function OfficePnlForm({ record, reportMonth, onSuccess, onCancel }: OfficePnlFormProps) {
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [feeCodes, setFeeCodes] = useState<any[]>([])
  const [payeeBanks, setPayeeBanks] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [showCustomFeeCode, setShowCustomFeeCode] = useState(false)
  const [showCustomBank, setShowCustomBank] = useState(false)
  const [newFeeCode, setNewFeeCode] = useState("")
  const [newBank, setNewBank] = useState("")
  const monthOptions = generateMonthOptions()

  const [formData, setFormData] = useState({
    feeCodeId: "",
    feeCodeCustom: "",
    companyId: "",
    companyName: "",
    payee: "",
    description: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceNo: "",
    priceTl: "",
    priceUsd: "",
    currencyRate: "",
    paymentStatus: "unpaid",
    payeeBankId: "",
    payeeBankCustom: "",
    paymentDate: "",
    type: "expense",
    notes: "",
    reportMonth: reportMonth || new Date().toISOString().slice(0, 7),
  })

  // Load dropdowns first, then populate form
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchFeeCodes(), fetchPayeeBanks(), fetchCompanies()])
      setDataLoaded(true)
    }
    loadAll()
  }, [])

  // Populate form AFTER dropdown data is loaded
  useEffect(() => {
    if (!dataLoaded || !record) return

    setFormData({
      feeCodeId: record.fee_code_id || "",
      feeCodeCustom: record.fee_code_custom || "",
      companyId: record.company_id || "",
      companyName: record.company_name || record.company_name_ref || "",
      payee: record.payee || "",
      description: record.description || "",
      invoiceDate: formatDate(record.invoice_date) || new Date().toISOString().split("T")[0],
      invoiceNo: record.invoice_no || "",
      priceTl: record.price_tl != null ? String(record.price_tl) : "",
      priceUsd: record.price_usd != null ? String(record.price_usd) : "",
      currencyRate: record.currency_rate != null ? String(record.currency_rate) : "",
      paymentStatus: record.payment_status || "unpaid",
      payeeBankId: record.payee_bank_id || "",
      payeeBankCustom: record.payee_bank_custom || "",
      paymentDate: formatDate(record.payment_date) || "",
      type: record.type || "expense",
      notes: record.notes || "",
      reportMonth: record.report_month || reportMonth || new Date().toISOString().slice(0, 7),
    })

    if (record.fee_code_custom && !record.fee_code_id) {
      setShowCustomFeeCode(true)
    }
    if (record.payee_bank_custom && !record.payee_bank_id) {
      setShowCustomBank(true)
    }
  }, [dataLoaded, record, reportMonth])

  // TL girildğinde ve kur varsa USD'yi hesapla
  useEffect(() => {
    if (formData.priceTl && formData.currencyRate) {
      const tl = parseFloat(formData.priceTl)
      const rate = parseFloat(formData.currencyRate)
      if (!isNaN(tl) && !isNaN(rate) && rate > 0) {
        const usd = (tl / rate).toFixed(2)
        setFormData((prev) => ({ ...prev, priceUsd: usd }))
      }
    }
  }, [formData.priceTl, formData.currencyRate])

  const fetchFeeCodes = async () => {
    try {
      const response = await fetch("/api/office-pnl/fee-codes")
      if (response.ok) {
        const data = await response.json()
        setFeeCodes(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching fee codes:", error)
    }
  }

  const fetchPayeeBanks = async () => {
    try {
      const response = await fetch("/api/office-pnl/payee-banks")
      if (response.ok) {
        const data = await response.json()
        setPayeeBanks(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching payee banks:", error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const handleAddFeeCode = async () => {
    if (!newFeeCode.trim()) return
    try {
      const response = await fetch("/api/office-pnl/fee-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFeeCode }),
      })
      if (response.ok) {
        const newCode = await response.json()
        setFeeCodes((prev) => [...prev, newCode])
        setFormData((prev) => ({ ...prev, feeCodeId: newCode.id, feeCodeCustom: "" }))
        setNewFeeCode("")
        setShowCustomFeeCode(false)
      }
    } catch (error) {
      console.error("Error adding fee code:", error)
    }
  }

  const handleAddBank = async () => {
    if (!newBank.trim()) return
    try {
      const response = await fetch("/api/office-pnl/payee-banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBank }),
      })
      if (response.ok) {
        const newBankData = await response.json()
        setPayeeBanks((prev) => [...prev, newBankData])
        setFormData((prev) => ({ ...prev, payeeBankId: newBankData.id, payeeBankCustom: "" }))
        setNewBank("")
        setShowCustomBank(false)
      }
    } catch (error) {
      console.error("Error adding bank:", error)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    setFormData((prev) => ({
      ...prev,
      companyId,
      companyName: company?.name || "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Only treat as edit if record has a valid ID
      const isEdit = record && record.id && typeof record.id === "string" && record.id.length > 0
      const url = isEdit ? `/api/office-pnl/record/${record.id}` : "/api/office-pnl"
      const method = isEdit ? "PUT" : "POST"

      const submitData = {
        feeCodeId: formData.feeCodeId || null,
        feeCodeCustom: formData.feeCodeCustom || null,
        companyId: formData.companyId || null,
        companyName: formData.companyName || null,
        payee: formData.payee,
        description: formData.description || null,
        invoiceDate: formData.invoiceDate || null,
        invoiceNo: formData.invoiceNo || null,
        priceTl: formData.priceTl ? parseFloat(formData.priceTl) : null,
        priceUsd: formData.priceUsd ? parseFloat(formData.priceUsd) : null,
        currencyRate: formData.currencyRate ? parseFloat(formData.currencyRate) : null,
        paymentStatus: formData.paymentStatus,
        payeeBankId: formData.payeeBankId || null,
        payeeBankCustom: formData.payeeBankCustom || null,
        paymentDate: formData.paymentDate || null,
        type: formData.type,
        notes: formData.notes || null,
        reportMonth: formData.reportMonth || null,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = "Kayıt başarısız"
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error saving record:", error)
      alert(`Kayıt başarısız: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rapor Ayı */}
      <Card>
        <CardHeader>
          <CardTitle>Rapor Dönemi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rapor Ayı *</Label>
              <Select
                value={formData.reportMonth}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, reportMonth: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ay seçin" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tip *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Gider</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temel Bilgiler */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feeCode">Fee Code *</Label>
              {showCustomFeeCode ? (
                <div className="flex gap-2">
                  <Input
                    value={newFeeCode}
                    onChange={(e) => setNewFeeCode(e.target.value)}
                    placeholder="Yeni fee code girin"
                  />
                  <Button type="button" size="icon" onClick={handleAddFeeCode}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCustomFeeCode(false)} className="bg-transparent">
                    Vazgeç
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={formData.feeCodeId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, feeCodeId: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Fee code seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeCodes.map((code) => (
                        <SelectItem key={code.id} value={code.id}>
                          {code.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowCustomFeeCode(true)} className="bg-transparent">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Şirket</Label>
              <Select value={formData.companyId} onValueChange={handleCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Şirket seçin" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payee">Payee (Ödeme Yapılan Firma) *</Label>
              <Input
                id="payee"
                value={formData.payee}
                onChange={(e) => setFormData((prev) => ({ ...prev, payee: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fatura Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle>Fatura Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Fatura Tarihi</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Fatura No</Label>
              <Input
                id="invoiceNo"
                value={formData.invoiceNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutar Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle>Tutar Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceTl">Tutar (TL)</Label>
              <Input
                id="priceTl"
                type="number"
                step="0.01"
                value={formData.priceTl}
                onChange={(e) => setFormData((prev) => ({ ...prev, priceTl: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyRate">USD/TL Kuru</Label>
              <Input
                id="currencyRate"
                type="number"
                step="0.0001"
                value={formData.currencyRate}
                onChange={(e) => setFormData((prev) => ({ ...prev, currencyRate: e.target.value }))}
                placeholder="Örn: 32.50"
              />
              <p className="text-xs text-muted-foreground">TL tutarını USD'ye çevirmek için</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceUsd">Tutar (USD)</Label>
              <Input
                id="priceUsd"
                type="number"
                step="0.01"
                value={formData.priceUsd}
                onChange={(e) => setFormData((prev) => ({ ...prev, priceUsd: e.target.value }))}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">TL ve kur girilirse otomatik hesaplanır</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ödeme Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Ödeme Durumu *</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Ödendi (Paid)</SelectItem>
                  <SelectItem value="unpaid">Ödenmedi (Unpaid)</SelectItem>
                  <SelectItem value="cancel">İptal (Cancel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Ödeme Tarihi</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payeeBank">Ödeme Yapılan Banka</Label>
            {showCustomBank ? (
              <div className="flex gap-2">
                <Input
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  placeholder="Yeni banka girin"
                />
                <Button type="button" size="icon" onClick={handleAddBank}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCustomBank(false)} className="bg-transparent">
                  Vazgeç
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={formData.payeeBankId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, payeeBankId: value }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Banka seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {payeeBanks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowCustomBank(true)} className="bg-transparent">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent">
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Kaydediliyor..." : record ? "Güncelle" : "Kaydet"}
        </Button>
      </div>
    </form>
  )
}
