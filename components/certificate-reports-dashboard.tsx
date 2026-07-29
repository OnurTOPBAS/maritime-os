"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

export function CertificateReportsDashboard() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)
  const [selectedFleet, setSelectedFleet] = useState<string>("all")
  const [fleets, setFleets] = useState<any[]>([])

  useEffect(() => {
    fetchFleets()
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [selectedFleet])

  const fetchFleets = async () => {
    try {
      const response = await fetch("/api/fleets")
      if (response.ok) {
        const data = await response.json()
        setFleets(data.fleets || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching fleets:", error)
      setFleets([])
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedFleet !== "all") {
        params.append("fleetId", selectedFleet)
      }

      const response = await fetch(`/api/certificates/reports/status?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedFleet !== "all") {
        params.append("fleetId", selectedFleet)
      }

      const response = await fetch(`/api/certificates/bulk-export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sertifika-raporu-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("[v0] Error exporting report:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  if (!reportData) {
    return <div className="text-center py-8">Veri yüklenemedi</div>
  }

  const statusData = [
    { name: "Geçerli", value: reportData.stats.valid, color: "#22c55e" },
    { name: "Uyarı", value: reportData.stats.warning, color: "#f59e0b" },
    { name: "Kritik", value: reportData.stats.critical, color: "#ef4444" },
    { name: "Süresi Dolmuş", value: reportData.stats.expired, color: "#991b1b" },
  ]

  const typeData = Object.entries(reportData.byType).map(([type, count]) => ({
    name: type,
    count,
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sertifika Raporları</h2>
          <p className="text-muted-foreground">Filo genelinde sertifika durumu ve analizler</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedFleet} onValueChange={setSelectedFleet}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filo seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Filolar</SelectItem>
              {fleets.map((fleet) => (
                <SelectItem key={fleet.id} value={fleet.id}>
                  {fleet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel'e Aktar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sertifika</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.stats.total}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geçerli</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reportData.stats.valid}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uyarı</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{reportData.stats.warning}</div>
            {reportData.stats.warning > 0 && (
              <p className="text-xs text-muted-foreground mt-1">90 gün içinde dolacak</p>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reportData.stats.critical}</div>
            {reportData.stats.critical > 0 && (
              <p className="text-xs text-muted-foreground mt-1">30 gün içinde dolacak</p>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolmuş</CardTitle>
            <XCircle className="h-4 w-4 text-red-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{reportData.stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sertifika Durum Dağılımı</CardTitle>
            <CardDescription>Sertifikaların geçerlilik durumuna göre dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sertifika Tiplerine Göre Dağılım</CardTitle>
            <CardDescription>En yaygın sertifika tipleri</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ship-wise breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Gemilere Göre Sertifika Durumu</CardTitle>
          <CardDescription>Her geminin sertifika uyumluluk durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.byShip.map((ship: any) => (
              <div key={ship.ship_name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  {ship.ship_id ? (
                    <Link href={`/dashboard/ships/${ship.ship_id}`} className="font-semibold hover:text-primary">
                      {ship.ship_name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{ship.ship_name}</span>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {ship.imo_number} • {ship.fleet_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default">{ship.total} Toplam</Badge>
                  {ship.expired > 0 && ship.ship_id && (
                    <Link href={`/dashboard/ships/${ship.ship_id}?status=expired`}>
                      <Badge variant="destructive" className="cursor-pointer hover:opacity-80">
                        {ship.expired} Dolmuş
                      </Badge>
                    </Link>
                  )}
                  {ship.critical > 0 && ship.ship_id && (
                    <Link href={`/dashboard/ships/${ship.ship_id}?status=critical`}>
                      <Badge variant="outline" className="border-red-500 text-red-600 cursor-pointer hover:bg-red-50">
                        {ship.critical} Kritik
                      </Badge>
                    </Link>
                  )}
                  {ship.warning > 0 && ship.ship_id && (
                    <Link href={`/dashboard/ships/${ship.ship_id}?status=warning`}>
                      <Badge
                        variant="outline"
                        className="border-orange-500 text-orange-600 cursor-pointer hover:bg-orange-50"
                      >
                        {ship.warning} Uyarı
                      </Badge>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
