"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  AlertCircle,
  BarChart3,
  History,
  Eye,
  LayoutGrid,
  LayoutList,
  Search,
  Star,
  Filter,
  Shield,
  XCircle,
} from "lucide-react"
import { ShipCertificateForm } from "./ship-certificate-form"
import { CertificateImportDialog } from "./certificate-import-dialog"
import { CertificateAuditLog } from "./certificate-audit-log"
import { CertificateVersionHistory } from "./certificate-version-history"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface ShipCertificateListProps {
  shipId: string
}

export function ShipCertificateList({ shipId }: ShipCertificateListProps) {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<any[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCertificate, setEditingCertificate] = useState<any>(null)
  const [previewCertificate, setPreviewCertificate] = useState<any>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [versionHistoryDialogOpen, setVersionHistoryDialogOpen] = useState(false)
  const [selectedCertificateForHistory, setSelectedCertificateForHistory] = useState<any>(null)

  const [complianceData, setComplianceData] = useState<any>(null)
  const [addMissingDialogOpen, setAddMissingDialogOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null)

  const [viewMode, setViewMode] = useState<"table" | "card">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("certificate_name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCertificates()
    fetchFavorites()
    loadPreferences()
    fetchCompliance()
  }, [shipId])

  useEffect(() => {
    let filtered = [...certificates]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (cert) =>
          cert.certificate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cert.certificate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cert.certificate_type?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((cert) => {
        const status = getCertificateStatus(cert)
        return status === statusFilter
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      if (sortBy === "expires_date" || sortBy === "issued_date") {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredCertificates(filtered)
  }, [certificates, searchQuery, statusFilter, sortBy, sortOrder])

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`/api/ships/${shipId}/certificates`)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error("[v0] Fetch certificates error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/certificates/favorites")
      if (response.ok) {
        const data = await response.json()
        setFavorites(data)
      }
    } catch (error) {
      console.error("[v0] Fetch favorites error:", error)
    }
  }

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/user/certificate-preferences")
      if (response.ok) {
        const prefs = await response.json()
        setViewMode(prefs.view_mode || "table")
        setSortBy(prefs.sort_by || "certificate_name")
        setSortOrder(prefs.sort_order || "asc")
      }
    } catch (error) {
      console.error("[v0] Load preferences error:", error)
    }
  }

  const savePreferences = async (newViewMode?: string, newSortBy?: string, newSortOrder?: string) => {
    try {
      await fetch("/api/user/certificate-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewMode: newViewMode || viewMode,
          sortBy: newSortBy || sortBy,
          sortOrder: newSortOrder || sortOrder,
        }),
      })
    } catch (error) {
      console.error("[v0] Save preferences error:", error)
    }
  }

  const toggleFavorite = async (certificateId: string) => {
    const isFavorite = favorites.includes(certificateId)

    try {
      if (isFavorite) {
        await fetch(`/api/certificates/favorites?certificateId=${certificateId}`, { method: "DELETE" })
        setFavorites(favorites.filter((id) => id !== certificateId))
      } else {
        await fetch("/api/certificates/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certificateId }),
        })
        setFavorites([...favorites, certificateId])
      }
    } catch (error) {
      console.error("[v0] Toggle favorite error:", error)
    }
  }

  const handleSuccess = (certificate: any) => {
    if (editingCertificate) {
      setCertificates(certificates.map((c) => (c.id === certificate.id ? certificate : c)))
    } else {
      setCertificates([...certificates, certificate])
    }
    setDialogOpen(false)
    setEditingCertificate(null)
  }

  const handleEdit = (certificate: any) => {
    setEditingCertificate(certificate)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu sertifikayı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/ships/${shipId}/certificates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCertificates(certificates.filter((c) => c.id !== id))
        toast({
          title: "Sertifika silindi",
          description: "İşlem başarıyla tamamlandı",
        })
      }
    } catch (error) {
      console.error("[v0] Delete certificate error:", error)
      toast({
        title: "Hata",
        description: "Sertifika silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const getCertificateStatus = (cert: any) => {
    if (cert.status === "not_applicable") return "not_applicable"
    if (!cert.expires_date) return "no_date"

    const daysUntilExpiry = Math.ceil((new Date(cert.expires_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry < 30) return "critical"
    if (daysUntilExpiry < 90) return "warning"
    return "valid"
  }

  const getStatusBadge = (status: string, expiresDate: string | null) => {
    if (status === "not_applicable") {
      return <Badge variant="secondary">Geçerli Değil</Badge>
    }

    if (!expiresDate) {
      return <Badge variant="secondary">Tarih Yok</Badge>
    }

    const daysUntilExpiry = Math.ceil((new Date(expiresDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Süresi Dolmuş</Badge>
    } else if (daysUntilExpiry < 90) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          {daysUntilExpiry} gün kaldı
        </Badge>
      )
    } else {
      return <Badge variant="default">Geçerli</Badge>
    }
  }

  const handlePreview = (certificate: any) => {
    setPreviewCertificate(certificate)
    setPreviewDialogOpen(true)
  }

  const handleVersionHistory = (certificate: any) => {
    setSelectedCertificateForHistory(certificate)
    setVersionHistoryDialogOpen(true)
  }

  const handleViewModeChange = (mode: "table" | "card") => {
    setViewMode(mode)
    savePreferences(mode, sortBy, sortOrder)
  }

  const handleSortChange = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc"
    setSortBy(field)
    setSortOrder(newOrder)
    savePreferences(viewMode, field, newOrder)
  }

  const fetchCompliance = async () => {
    try {
      const response = await fetch(`/api/ships/${shipId}/compliance`)
      if (response.ok) {
        const data = await response.json()
        setComplianceData(data)
      }
    } catch (error) {
      console.error("[v0] Fetch compliance error:", error)
    }
  }

  const handleAddMissingCertificate = (requirement: any) => {
    setSelectedRequirement(requirement)
    setEditingCertificate({
      certificate_name: requirement.certificate_name,
      certificate_type: requirement.certificate_type,
    })
    setAddMissingDialogOpen(true)
  }

  const handleMissingCertificateSuccess = (certificate: any) => {
    setCertificates([...certificates, certificate])
    setAddMissingDialogOpen(false)
    setSelectedRequirement(null)
    setEditingCertificate(null)
    // Refresh compliance data
    fetchCompliance()
    toast({
      title: "Sertifika eklendi",
      description: "Eksik sertifika başarıyla eklendi ve uyumluluk skoru güncellendi",
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">Mükemmel</Badge>
    if (score >= 70) return <Badge className="bg-yellow-600">İyi</Badge>
    return <Badge variant="destructive">Yetersiz</Badge>
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      {complianceData && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Shield className="h-4 w-4 md:h-5 md:w-5" />
              Uyumluluk Skoru
            </CardTitle>
            <CardDescription className="text-sm">
              {complianceData.ship.name} - {complianceData.ship.vessel_type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="text-center sm:text-left">
                <div className={`text-4xl md:text-5xl font-bold ${getScoreColor(complianceData.complianceScore)}`}>
                  {complianceData.complianceScore}%
                </div>
                <div className="mt-2">{getScoreBadge(complianceData.complianceScore)}</div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-sm text-muted-foreground">Zorunlu Sertifikalar</div>
                <div className="text-xl md:text-2xl font-semibold">
                  {complianceData.summary.valid} / {complianceData.summary.mandatory}
                </div>
              </div>
            </div>
            <Progress value={complianceData.complianceScore} className="h-2 md:h-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600">{complianceData.summary.valid}</div>
                <div className="text-xs text-muted-foreground">Geçerli</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-red-600">{complianceData.summary.missing}</div>
                <div className="text-xs text-muted-foreground">Eksik</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-orange-600">{complianceData.summary.critical}</div>
                <div className="text-xs text-muted-foreground">Kritik</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-yellow-600">{complianceData.summary.warning}</div>
                <div className="text-xs text-muted-foreground">Uyarı</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {complianceData?.expiredCertificates?.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="text-sm md:text-base">Süresi Dolmuş Sertifikalar</AlertTitle>
          <AlertDescription className="text-xs md:text-sm">
            {complianceData.expiredCertificates.length} adet sertifikanın süresi dolmuş. Acil yenileme gerekiyor.
          </AlertDescription>
        </Alert>
      )}

      {complianceData?.missingCertificates?.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              Eksik Sertifikalar ({complianceData.missingCertificates.length})
            </CardTitle>
            <CardDescription className="text-sm">Bu sertifikaların eklenmesi zorunludur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceData.missingCertificates.map((item: any) => (
                <div key={item.requirement.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.requirement.certificate_name}</p>
                    <p className="text-xs text-muted-foreground">{item.requirement.regulatory_reference}</p>
                  </div>
                  <Button size="sm" onClick={() => handleAddMissingCertificate(item.requirement)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">Gemi Sertifikaları</h3>
            <p className="text-sm text-muted-foreground">Gemiye ait tüm sertifikalar ve geçerlilik tarihleri</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtrele
            </Button>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("table")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/certificates/reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Raporlar
              </Link>
            </Button>
            <CertificateImportDialog shipId={shipId} onSuccess={fetchCertificates} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCertificate(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Sertifika
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCertificate ? "Sertifika Düzenle" : "Yeni Sertifika Ekle"}</DialogTitle>
                </DialogHeader>
                <ShipCertificateForm shipId={shipId} certificate={editingCertificate} onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sertifika ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="valid">Geçerli</SelectItem>
                    <SelectItem value="warning">Uyarı (90 gün)</SelectItem>
                    <SelectItem value="critical">Kritik (30 gün)</SelectItem>
                    <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value) => handleSortChange(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certificate_name">İsim</SelectItem>
                    <SelectItem value="expires_date">Son Kullanma Tarihi</SelectItem>
                    <SelectItem value="issued_date">Verilme Tarihi</SelectItem>
                    <SelectItem value="certificate_type">Tip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {certificates.length === 0 ? "Henüz sertifika eklenmemiş" : "Filtreye uygun sertifika bulunamadı"}
            </p>
            {certificates.length === 0 && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Sertifikayı Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Sertifika Adı</TableHead>
                    <TableHead>Verilme Tarihi</TableHead>
                    <TableHead>Son Yıllık</TableHead>
                    <TableHead>Son Ara</TableHead>
                    <TableHead>Son Kullanma</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert, index) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(cert.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Star
                            className={`h-4 w-4 ${favorites.includes(cert.id) ? "fill-yellow-400 text-yellow-400" : ""}`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cert.certificate_name}</p>
                          {cert.certificate_number && (
                            <p className="text-xs text-muted-foreground">No: {cert.certificate_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(cert.issued_date)}</TableCell>
                      <TableCell>{formatDate(cert.last_annual_date)}</TableCell>
                      <TableCell>{formatDate(cert.last_intermediate_date)}</TableCell>
                      <TableCell>{formatDate(cert.expires_date)}</TableCell>
                      <TableCell>{getStatusBadge(cert.status, cert.expires_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVersionHistory(cert)}
                            title="Versiyon Geçmişi"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          {cert.file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(cert)}
                              title="Hızlı Önizleme"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(cert)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(cert.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCertificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{cert.certificate_name}</h4>
                    {cert.certificate_number && (
                      <p className="text-sm text-muted-foreground">No: {cert.certificate_number}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleFavorite(cert.id)} className="h-8 w-8 p-0">
                    <Star
                      className={`h-4 w-4 ${favorites.includes(cert.id) ? "fill-yellow-400 text-yellow-400" : ""}`}
                    />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verilme:</span>
                    <span className="font-medium">{formatDate(cert.issued_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Son Kullanma:</span>
                    <span className="font-medium">{formatDate(cert.expires_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Durum:</span>
                    {getStatusBadge(cert.status, cert.expires_date)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {cert.file_url && (
                    <Button variant="outline" size="sm" onClick={() => handlePreview(cert)} className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Önizle
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(cert)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Sertifika Önizleme</DialogTitle>
          </DialogHeader>
          {previewCertificate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sertifika Adı</p>
                  <p className="text-base">{previewCertificate.certificate_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sertifika No</p>
                  <p className="text-base">{previewCertificate.certificate_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verilme Tarihi</p>
                  <p className="text-base">{formatDate(previewCertificate.issued_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Son Kullanma Tarihi</p>
                  <p className="text-base">{formatDate(previewCertificate.expires_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Veren Kurum</p>
                  <p className="text-base">{previewCertificate.issuing_authority || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sorumlu Kişi</p>
                  <p className="text-base">{previewCertificate.responsible_person || "N/A"}</p>
                </div>
              </div>
              {previewCertificate.file_url && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Döküman</p>
                  {previewCertificate.file_url.endsWith(".pdf") ? (
                    <iframe src={previewCertificate.file_url} className="w-full h-[500px] rounded" />
                  ) : (
                    <img
                      src={previewCertificate.file_url || "/placeholder.svg"}
                      alt="Certificate"
                      className="w-full h-auto rounded"
                    />
                  )}
                  <Button asChild className="mt-4 w-full">
                    <a href={previewCertificate.file_url} target="_blank" rel="noopener noreferrer">
                      Tam Boyutta Aç
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={versionHistoryDialogOpen} onOpenChange={setVersionHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sertifika Geçmişi</DialogTitle>
          </DialogHeader>
          {selectedCertificateForHistory && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="font-semibold">{selectedCertificateForHistory.certificate_name}</p>
                <p className="text-sm text-muted-foreground">
                  Sertifika No: {selectedCertificateForHistory.certificate_number || "N/A"}
                </p>
              </div>
              <Tabs defaultValue="versions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="versions">Versiyon Geçmişi</TabsTrigger>
                  <TabsTrigger value="audit">Değişiklik Kaydı</TabsTrigger>
                </TabsList>
                <TabsContent value="versions">
                  <CertificateVersionHistory certificateId={selectedCertificateForHistory.id} />
                </TabsContent>
                <TabsContent value="audit">
                  <CertificateAuditLog certificateId={selectedCertificateForHistory.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addMissingDialogOpen} onOpenChange={setAddMissingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eksik Sertifika Ekle</DialogTitle>
            {selectedRequirement && (
              <p className="text-sm text-muted-foreground">
                {selectedRequirement.certificate_name} - {selectedRequirement.regulatory_reference}
              </p>
            )}
          </DialogHeader>
          <ShipCertificateForm
            shipId={shipId}
            certificate={editingCertificate}
            onSuccess={handleMissingCertificateSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
