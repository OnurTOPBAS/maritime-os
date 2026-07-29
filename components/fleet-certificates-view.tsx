"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Ship, FileText, Download, AlertCircle, X, BarChart3 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function FleetCertificatesView() {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [shipFilter, setShipFilter] = useState("all")

  useEffect(() => {
    fetchAllCertificates()
  }, [])

  const fetchAllCertificates = async () => {
    try {
      const response = await fetch("/api/certificates/all")
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error("[v0] Fetch all certificates error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCertificates.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleBulkExport = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir sertifika seçin",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/certificates/bulk-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateIds: selectedIds }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `certificates-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Başarılı",
          description: `${selectedIds.length} sertifika dışa aktarıldı`,
        })
      }
    } catch (error) {
      console.error("[v0] Bulk export error:", error)
      toast({
        title: "Hata",
        description: "Dışa aktarma sırasında bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleBulkSendReminders = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir sertifika seçin",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/certificates/bulk-remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateIds: selectedIds }),
      })

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: `${selectedIds.length} sertifika için hatırlatma gönderildi`,
        })
      }
    } catch (error) {
      console.error("[v0] Bulk remind error:", error)
      toast({
        title: "Hata",
        description: "Hatırlatma gönderilirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const getStatusInfo = (expiresDate: string | null) => {
    if (!expiresDate) {
      return { label: "Tarih Yok", variant: "secondary" as const, priority: 0 }
    }

    const daysUntilExpiry = Math.ceil((new Date(expiresDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { label: "Süresi Dolmuş", variant: "destructive" as const, priority: 4 }
    } else if (daysUntilExpiry <= 7) {
      return { label: `${daysUntilExpiry} gün`, variant: "destructive" as const, priority: 3 }
    } else if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry} gün`, variant: "outline" as const, priority: 2 }
    } else if (daysUntilExpiry <= 90) {
      return { label: `${daysUntilExpiry} gün`, variant: "secondary" as const, priority: 1 }
    } else {
      return { label: "Geçerli", variant: "default" as const, priority: 0 }
    }
  }

  const uniqueShips = Array.from(new Set(certificates.map((c) => c.ship_name))).sort()

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.certificate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.ship_name.toLowerCase().includes(searchTerm.toLowerCase())

    const status = getStatusInfo(cert.expires_date)
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "expired" && status.priority === 4) ||
      (statusFilter === "critical" && status.priority >= 3) ||
      (statusFilter === "warning" && status.priority >= 1) ||
      (statusFilter === "valid" && status.priority === 0)

    const matchesShip = shipFilter === "all" || cert.ship_name === shipFilter

    return matchesSearch && matchesStatus && matchesShip
  })

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Filo Sertifikaları
            </CardTitle>
            <Button asChild variant="outline">
              <Link href="/dashboard/certificates/reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Raporlar ve Analiz
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Sertifika veya gemi adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                <SelectItem value="critical">Kritik (≤7 gün)</SelectItem>
                <SelectItem value="warning">Uyarı (≤90 gün)</SelectItem>
                <SelectItem value="valid">Geçerli</SelectItem>
              </SelectContent>
            </Select>
            <Select value={shipFilter} onValueChange={setShipFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Gemi filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Gemiler</SelectItem>
                {uniqueShips.map((ship) => (
                  <SelectItem key={ship} value={ship}>
                    {ship}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || statusFilter !== "all" || shipFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setShipFilter("all")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedIds.length} sertifika seçildi</span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={handleBulkExport}>
                <Download className="h-4 w-4 mr-2" />
                Excel İndir
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkSendReminders}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Hatırlatma Gönder
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Seçimi Temizle
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedIds.length === filteredCertificates.length && filteredCertificates.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Gemi</TableHead>
                  <TableHead>Sertifika</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Verilme</TableHead>
                  <TableHead>Son Kullanma</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Dosya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Sertifika bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertificates.map((cert) => {
                    const status = getStatusInfo(cert.expires_date)
                    return (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(cert.id)}
                            onCheckedChange={(checked) => handleSelectOne(cert.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/ships/${cert.ship_id}?tab=certificates`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <Ship className="h-4 w-4" />
                            {cert.ship_name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.certificate_name}</p>
                            {cert.certificate_number && (
                              <p className="text-xs text-muted-foreground">No: {cert.certificate_number}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{cert.certificate_type}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(cert.issued_date)}</TableCell>
                        <TableCell>{formatDate(cert.expires_date)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {cert.file_url ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={cert.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
