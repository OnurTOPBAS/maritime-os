"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, File } from "lucide-react"

interface InvoiceFormProps {
  companyId: string
  invoice?: any
  onSuccess: () => void
  onCancel: () => void
}

const formatDate = (date: any): string => {
  if (!date) return ""
  if (typeof date === "string") return date.split("T")[0]
  if (date instanceof Date) return date.toISOString().split("T")[0]
  return String(date).split("T")[0]
}

export function InvoiceForm({ companyId, invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [fixtures, setFixtures] = useState<any[]>([])
  const [voyages, setVoyages] = useState<any[]>([])
  const [selectedFixture, setSelectedFixture] = useState<any>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    type: "income",
    invoiceType: "",
    fixtureId: "",
    voyageId: "",
    shipName: "",
    charterer: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    freightGrossUsd: "",
    freightNetUsd: "",
    usdAedRate: "3.6725",
    freightNetAed: "",
    status: "pending",
    brokerCommission: "",
    brokerCommissionStatus: "pending",
    amount: "",
    currency: "USD",
    description: "",
    notes: "",
  })

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoice_number || "",
        type: invoice.type || "income",
        invoiceType: invoice.invoice_type || "",
        fixtureId: invoice.fixture_id || "",
        voyageId: invoice.voyage_id || "",
        shipName: invoice.ship_name || "",
        charterer: invoice.charterer || "",
        invoiceDate: formatDate(invoice.invoice_date) || new Date().toISOString().split("T")[0],
        dueDate: formatDate(invoice.due_date) || "",
        freightGrossUsd: invoice.freight_gross_usd?.toString() || "",
        freightNetUsd: invoice.freight_net_usd?.toString() || "",
        usdAedRate: invoice.usd_aed_rate?.toString() || "3.6725",
        freightNetAed: invoice.freight_net_aed?.toString() || "",
        status: invoice.status || "pending",
        brokerCommission: invoice.broker_commission?.toString() || "",
        brokerCommissionStatus: invoice.broker_commission_status || "pending",
        amount: invoice.amount?.toString() || "",
        currency: invoice.currency || "USD",
        description: invoice.description || "",
        notes: invoice.notes || "",
      })
    }
  }, [invoice])

  useEffect(() => {
    fetchFixtures()
  }, [companyId])

  useEffect(() => {
    if (formData.fixtureId && formData.fixtureId !== "") {
      fetchVoyages(formData.fixtureId)
      const fixture = fixtures.find((f) => f.id === formData.fixtureId)
      if (fixture) {
        setSelectedFixture(fixture)
        setFormData((prev) => ({
          ...prev,
          shipName: fixture.ship_name || "",
          charterer: fixture.charterer || "",
        }))
      }
    } else {
      setVoyages([])
      setSelectedFixture(null)
    }
  }, [formData.fixtureId, fixtures])

  useEffect(() => {
    if (formData.freightGrossUsd && !isNaN(Number.parseFloat(formData.freightGrossUsd))) {
      const gross = Number.parseFloat(formData.freightGrossUsd)
      const commission = (gross * 0.0125).toFixed(2)
      setFormData((prev) => ({ ...prev, brokerCommission: commission }))
    }
  }, [formData.freightGrossUsd])

  useEffect(() => {
    if (
      formData.freightNetUsd &&
      formData.usdAedRate &&
      !isNaN(Number.parseFloat(formData.freightNetUsd)) &&
      !isNaN(Number.parseFloat(formData.usdAedRate))
    ) {
      const netUsd = Number.parseFloat(formData.freightNetUsd)
      const rate = Number.parseFloat(formData.usdAedRate)
      const netAed = (netUsd * rate).toFixed(2)
      setFormData((prev) => ({ ...prev, freightNetAed: netAed }))
    }
  }, [formData.freightNetUsd, formData.usdAedRate])

  useEffect(() => {
    // For freight, demurrage, and commission types, auto-set amount from freight net values
    if (
      formData.invoiceType === "freight" ||
      formData.invoiceType === "demurrage" ||
      formData.invoiceType === "commission"
    ) {
      if (formData.currency === "USD" && formData.freightNetUsd) {
        setFormData((prev) => ({ ...prev, amount: formData.freightNetUsd }))
      } else if (formData.currency === "AED" && formData.freightNetAed) {
        setFormData((prev) => ({ ...prev, amount: formData.freightNetAed }))
      }
    }
    // For AWRP and Other types, amount is manually entered (no auto-calculation)
  }, [formData.invoiceType, formData.currency, formData.freightNetUsd, formData.freightNetAed])

  useEffect(() => {
    if (invoice?.id) {
      fetchAttachments()
    }
  }, [invoice])

  const fetchFixtures = async () => {
    try {
      const response = await fetch(`/api/fixtures?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setFixtures(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching fixtures:", error)
    }
  }

  const fetchVoyages = async (fixtureId: string) => {
    try {
      const response = await fetch(`/api/voyages?fixtureId=${fixtureId}`)
      if (response.ok) {
        const data = await response.json()
        setVoyages(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching voyages:", error)
    }
  }

  const fetchAttachments = async () => {
    if (!invoice?.id) return
    try {
      const response = await fetch(`/api/invoice-attachments?invoiceId=${invoice.id}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error("Error fetching attachments:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = invoice ? `/api/invoices/${invoice.id}` : "/api/invoices"
      const method = invoice ? "PUT" : "POST"

      const submitData = {
        companyId,
        invoiceNumber: formData.invoiceNumber,
        type: formData.type,
        invoiceType: formData.invoiceType || null,
        fixtureId: formData.fixtureId || null,
        voyageId: formData.voyageId || null,
        shipName: formData.shipName || null,
        charterer: formData.charterer || null,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate || null,
        freightGrossUsd: formData.freightGrossUsd ? Number.parseFloat(formData.freightGrossUsd) : null,
        freightNetUsd: formData.freightNetUsd ? Number.parseFloat(formData.freightNetUsd) : null,
        usdAedRate: formData.usdAedRate ? Number.parseFloat(formData.usdAedRate) : 3.6725,
        freightNetAed: formData.freightNetAed ? Number.parseFloat(formData.freightNetAed) : null,
        status: formData.status,
        brokerCommission: formData.brokerCommission ? Number.parseFloat(formData.brokerCommission) : null,
        brokerCommissionStatus: formData.brokerCommissionStatus,
        amount: formData.amount ? Number.parseFloat(formData.amount) : 0,
        currency: formData.currency,
        description: formData.description || null,
        notes: formData.notes || null,
      }

      console.log("[v0] Submitting invoice with data:", submitData)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Invoice save failed:", errorData)
        throw new Error(errorData.error || errorData.errors?.[0]?.message || "Failed to save invoice")
      }

      const result = await response.json()
      console.log("[v0] Invoice saved successfully:", result)

      onSuccess()
    } catch (error: any) {
      console.error("[v0] Error saving invoice:", error.message)
      alert(`Fatura kaydedilemedi: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !invoice?.id) return

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("invoiceId", invoice.id)

      const response = await fetch("/api/invoice-attachments", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await fetchAttachments()
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Dosya yüklenemedi")
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Bu dosyayı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/invoice-attachments/${attachmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchAttachments()
      }
    } catch (error) {
      console.error("Error deleting attachment:", error)
    }
  }

  const showFreightFields =
    formData.invoiceType === "freight" || formData.invoiceType === "demurrage" || formData.invoiceType === "commission"

  const isAmountAutoCalculated =
    formData.invoiceType === "freight" || formData.invoiceType === "demurrage" || formData.invoiceType === "commission"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Fatura No *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tip *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceType">Fatura Türü</Label>
            <Select
              value={formData.invoiceType}
              onValueChange={(value) => setFormData({ ...formData, invoiceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fatura türü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freight">Navlun</SelectItem>
                <SelectItem value="demurrage">Demuraj</SelectItem>
                <SelectItem value="awrp">AWRP</SelectItem>
                <SelectItem value="commission">Komisyon</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fixture">Fixture (Opsiyonel)</Label>
              <Select
                value={formData.fixtureId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, fixtureId: value === "none" ? "" : value, voyageId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fixture seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {fixtures.map((fixture) => (
                    <SelectItem key={fixture.id} value={fixture.id}>
                      {fixture.ship_name} - {fixture.charterer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voyage">Sefer (Opsiyonel)</Label>
              <Select
                value={formData.voyageId || "none"}
                onValueChange={(value) => setFormData({ ...formData, voyageId: value === "none" ? "" : value })}
                disabled={!formData.fixtureId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sefer seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {voyages.map((voyage) => (
                    <SelectItem key={voyage.id} value={voyage.id}>
                      {voyage.voyage_number} - {voyage.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipName">Gemi Adı</Label>
              <Input
                id="shipName"
                value={formData.shipName}
                onChange={(e) => setFormData({ ...formData, shipName: e.target.value })}
                placeholder="Fixture seçiminden otomatik gelir"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="charterer">Kiracı (Charterer)</Label>
              <Input
                id="charterer"
                value={formData.charterer}
                onChange={(e) => setFormData({ ...formData, charterer: e.target.value })}
                placeholder="Fixture seçiminden otomatik gelir"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Fatura Tarihi *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Vade Tarihi</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Freight Details - Only show for freight, demurrage, commission */}
      {showFreightFields && (
        <Card>
          <CardHeader>
            <CardTitle>Navlun Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="freightGrossUsd">Navlun Gross USD</Label>
                <Input
                  id="freightGrossUsd"
                  type="number"
                  step="0.01"
                  value={formData.freightGrossUsd}
                  onChange={(e) => setFormData({ ...formData, freightGrossUsd: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freightNetUsd">Navlun Net USD</Label>
                <Input
                  id="freightNetUsd"
                  type="number"
                  step="0.01"
                  value={formData.freightNetUsd}
                  onChange={(e) => setFormData({ ...formData, freightNetUsd: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usdAedRate">USD x AED Kur</Label>
                <Input
                  id="usdAedRate"
                  type="number"
                  step="0.0001"
                  value={formData.usdAedRate}
                  onChange={(e) => setFormData({ ...formData, usdAedRate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Varsayılan: 3.6725</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="freightNetAed">Navlun Net AED</Label>
                <Input id="freightNetAed" type="number" step="0.01" value={formData.freightNetAed} disabled />
                <p className="text-xs text-muted-foreground">Otomatik hesaplanır</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brokerCommission">Broker Commission (1.25%)</Label>
                <Input id="brokerCommission" type="number" step="0.01" value={formData.brokerCommission} disabled />
                <p className="text-xs text-muted-foreground">Gross tutarın %1.25'i</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brokerCommissionStatus">Broker Comm Durumu</Label>
                <Select
                  value={formData.brokerCommissionStatus}
                  onValueChange={(value) => setFormData({ ...formData, brokerCommissionStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="paid">Ödendi</SelectItem>
                    <SelectItem value="overdue">Vadesi Geçti</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={isAmountAutoCalculated}
                required
              />
              {isAmountAutoCalculated && (
                <p className="text-xs text-muted-foreground">
                  Para birimine göre otomatik hesaplanır (USD: Net USD, AED: Net AED)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="TRY">TRY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Fatura Durumu</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="paid">Ödendi</SelectItem>
                <SelectItem value="overdue">Vadesi Geçti</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Attachments */}
      {invoice?.id && (
        <Card>
          <CardHeader>
            <CardTitle>Dosya Ekleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Dosya Yükle</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="flex-1"
                />
                {uploadingFile && <span className="text-sm text-muted-foreground">Yükleniyor...</span>}
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Yüklenen Dosyalar</Label>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <a
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline"
                          >
                            {attachment.file_name}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.file_size / 1024).toFixed(2)} KB •{" "}
                            {new Date(attachment.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Kaydediliyor..." : invoice ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  )
}
