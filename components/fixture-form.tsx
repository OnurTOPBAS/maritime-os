"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Anchor, Ship, Waves } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FixtureFormProps {
  shipId: string
  onSuccess: (fixture: any) => void
  fixture?: any
}

export function FixtureForm({ shipId, onSuccess, fixture }: FixtureFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadPorts, setLoadPorts] = useState<string[]>([])
  const [dischargePorts, setDischargePorts] = useState<string[]>([])
  const [newLoadPort, setNewLoadPort] = useState("")
  const [newDischargePort, setNewDischargePort] = useState("")
  const [chartererSearch, setChartererSearch] = useState("")
  const [formData, setFormData] = useState({
    fixture_type: "",
    charterer: "",
    cargo_type: "",
    rate: "",
    rate_type: "",
    cp_date: "",
    laycan_from: "",
    laycan_to: "",
    demurrage_rate: "",
    payment_type: "",
    status: "fixed",
    notes: "",
  })

  useEffect(() => {
    if (fixture) {
      const formatDate = (date: any) => {
        if (!date) return ""
        if (typeof date === "string") return date.split("T")[0]
        if (date instanceof Date) return date.toISOString().split("T")[0]
        return String(date).split("T")[0]
      }

      const parsePort = (port: any) => {
        if (!port) return []
        if (Array.isArray(port)) return port
        try {
          const parsed = JSON.parse(port)
          return Array.isArray(parsed) ? parsed : [port]
        } catch {
          return [port]
        }
      }

      setLoadPorts(parsePort(fixture.load_port))
      setDischargePorts(parsePort(fixture.discharge_port))

      setFormData({
        fixture_type: fixture.fixture_type || "",
        charterer: fixture.charterer || "",
        cargo_type: fixture.cargo_type || "",
        rate: fixture.rate?.toString() || "",
        rate_type: fixture.rate_type || "",
        cp_date: formatDate(fixture.cp_date),
        laycan_from: formatDate(fixture.laycan_from),
        laycan_to: formatDate(fixture.laycan_to),
        demurrage_rate: fixture.demurrage_rate?.toString() || "",
        payment_type: fixture.payment_type || "",
        status: fixture.status || "fixed",
        notes: fixture.notes || "",
      })
      setChartererSearch(fixture.charterer || "")
    }
  }, [fixture])

  const addLoadPort = () => {
    if (newLoadPort.trim() && !loadPorts.includes(newLoadPort.trim())) {
      setLoadPorts([...loadPorts, newLoadPort.trim()])
      setNewLoadPort("")
    }
  }

  const removeLoadPort = (port: string) => {
    setLoadPorts(loadPorts.filter((p) => p !== port))
  }

  const addDischargePort = () => {
    if (newDischargePort.trim() && !dischargePorts.includes(newDischargePort.trim())) {
      setDischargePorts([...dischargePorts, newDischargePort.trim()])
      setNewDischargePort("")
    }
  }

  const removeDischargePort = (port: string) => {
    setDischargePorts(dischargePorts.filter((p) => p !== port))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = fixture ? `/api/fixtures/${fixture.id}` : "/api/fixtures"
      const method = fixture ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ship_id: shipId,
          fixture_type: formData.fixture_type || null,
          charterer: formData.charterer,
          cargo_type: formData.cargo_type || null,
          rate: formData.rate ? Number.parseFloat(formData.rate) : null,
          rate_type: formData.rate_type || null,
          cp_date: formData.cp_date || null,
          laycan_from: formData.laycan_from || null,
          laycan_to: formData.laycan_to || null,
          load_port: loadPorts.length > 0 ? loadPorts : null,
          discharge_port: dischargePorts.length > 0 ? dischargePorts : null,
          demurrage_rate: formData.demurrage_rate ? Number.parseFloat(formData.demurrage_rate) : null,
          payment_type: formData.payment_type || null,
          status: formData.status,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess(data.fixture)
      }
    } catch (error) {
      console.error("[v0] Save fixture error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Anchor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Temel Bilgiler</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fixture_type" className="text-sm font-medium">
              Fixture Tipi *
            </Label>
            <Select
              value={formData.fixture_type}
              onValueChange={(value) => setFormData({ ...formData, fixture_type: value })}
            >
              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600">
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VCP">VCP (Voyage Charter Party)</SelectItem>
                <SelectItem value="TC">TC (Time Charter)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="charterer" className="text-sm font-medium">
              Kiracı (Charterer) *
            </Label>
            <Input
              id="charterer"
              value={chartererSearch}
              onChange={(e) => {
                setChartererSearch(e.target.value)
                setFormData({ ...formData, charterer: e.target.value })
              }}
              required
              disabled={loading}
              placeholder="Kiracı adını yazın..."
              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-cyan-200 dark:border-cyan-800">
          <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <Ship className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-100">Kargo ve Tarihler</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cargo_type" className="text-sm font-medium">
              Kargo Tipi
            </Label>
            <Input
              id="cargo_type"
              value={formData.cargo_type}
              onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
              disabled={loading}
              placeholder="Örn: Coal, Grain, Iron Ore"
              className="border-blue-200 dark:border-blue-900/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp_date" className="text-sm font-medium">
              CP Tarihi
            </Label>
            <Input
              id="cp_date"
              type="date"
              value={formData.cp_date}
              onChange={(e) => setFormData({ ...formData, cp_date: e.target.value })}
              disabled={loading}
              className="border-blue-200 dark:border-blue-900/50"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-emerald-200 dark:border-emerald-800">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">$</span>
          </div>
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Finansal Bilgiler</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rate" className="text-sm font-medium">
              Freight Rate
            </Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              disabled={loading}
              placeholder="Örn: 25000"
              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate_type" className="text-sm font-medium">
              Freight Rate Tipi
            </Label>
            <Input
              id="rate_type"
              value={formData.rate_type}
              onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
              disabled={loading}
              placeholder="Örn: per day, lumpsum"
              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Waves className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Limanlar</h3>
        </div>

        <div className="space-y-2">
          <Label>Yükleme Limanları</Label>
          <div className="flex gap-2">
            <Input
              value={newLoadPort}
              onChange={(e) => setNewLoadPort(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addLoadPort()
                }
              }}
              disabled={loading}
              placeholder="Liman adı yazın ve Enter'a basın"
              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600"
            />
            <Button type="button" onClick={addLoadPort} disabled={loading} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {loadPorts.map((port) => (
              <Badge key={port} variant="secondary" className="gap-1">
                {port}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeLoadPort(port)} />
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tahliye Limanları</Label>
          <div className="flex gap-2">
            <Input
              value={newDischargePort}
              onChange={(e) => setNewDischargePort(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addDischargePort()
                }
              }}
              disabled={loading}
              placeholder="Liman adı yazın ve Enter'a basın"
              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600"
            />
            <Button type="button" onClick={addDischargePort} disabled={loading} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {dischargePorts.map((port) => (
              <Badge key={port} variant="secondary" className="gap-1">
                {port}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeDischargePort(port)} />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Status</span>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Durum</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Durum
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="subs">Subs</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Notes</span>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Notlar</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notlar
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={loading}
              rows={3}
              placeholder="Ek notlar ve detaylar"
              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-400 dark:focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        disabled={loading}
      >
        {loading ? (fixture ? "Güncelleniyor..." : "Ekleniyor...") : fixture ? "Güncelle" : "Fixture Ekle"}
      </Button>
    </form>
  )
}
