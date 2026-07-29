"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, XCircle, AlertTriangle, Shield, Plus } from "lucide-react"
import Link from "next/link"

interface ShipComplianceDashboardProps {
  shipId: string
}

export function ShipComplianceDashboard({ shipId }: ShipComplianceDashboardProps) {
  const [complianceData, setComplianceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creatingCertificate, setCreatingCertificate] = useState(false)

  useEffect(() => {
    fetchCompliance()
  }, [shipId])

  const fetchCompliance = async () => {
    try {
      const response = await fetch(`/api/ships/${shipId}/compliance`)
      if (response.ok) {
        const data = await response.json()
        setComplianceData(data)
      }
    } catch (error) {
      console.error("[v0] Fetch compliance error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Uyumluluk durumu kontrol ediliyor...</div>
  }

  if (!complianceData) {
    return <div className="text-center py-8">Uyumluluk verisi yüklenemedi</div>
  }

  const {
    ship,
    complianceScore,
    summary,
    missingCertificates,
    expiredCertificates,
    criticalCertificates,
    warningCertificates,
  } = complianceData

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

  const handleAddMissingCertificate = async (requirement: any) => {
    setCreatingCertificate(true)
    try {
      console.log("[v0] Creating certificate from requirement:", requirement)

      // Navigate to certificates page with pre-filled data
      const params = new URLSearchParams({
        name: requirement.certificate_name,
        type: requirement.certificate_type,
        autoCreate: "true",
      })

      window.location.href = `/dashboard/ships/${shipId}/certificates?${params.toString()}`
    } catch (error) {
      console.error("[v0] Error navigating to certificate creation:", error)
    } finally {
      setCreatingCertificate(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Shield className="h-4 w-4 md:h-5 md:w-5" />
            Uyumluluk Skoru
          </CardTitle>
          <CardDescription className="text-sm">
            {ship.name} - {ship.vessel_type}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="text-center sm:text-left">
              <div className={`text-4xl md:text-5xl font-bold ${getScoreColor(complianceScore)}`}>
                {complianceScore}%
              </div>
              <div className="mt-2">{getScoreBadge(complianceScore)}</div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-sm text-muted-foreground">Zorunlu Sertifikalar</div>
              <div className="text-xl md:text-2xl font-semibold">
                {summary.valid} / {summary.mandatory}
              </div>
            </div>
          </div>
          <Progress value={complianceScore} className="h-2 md:h-3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{summary.valid}</div>
              <div className="text-xs text-muted-foreground">Geçerli</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-red-600">{summary.missing}</div>
              <div className="text-xs text-muted-foreground">Eksik</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-orange-600">{summary.critical}</div>
              <div className="text-xs text-muted-foreground">Kritik</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{summary.warning}</div>
              <div className="text-xs text-muted-foreground">Uyarı</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {expiredCertificates.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="text-sm md:text-base">Süresi Dolmuş Sertifikalar</AlertTitle>
          <AlertDescription className="text-xs md:text-sm">
            {expiredCertificates.length} adet sertifikanın süresi dolmuş. Acil yenileme gerekiyor.
          </AlertDescription>
        </Alert>
      )}

      {missingCertificates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              Eksik Sertifikalar
            </CardTitle>
            <CardDescription className="text-sm">Bu sertifikaların eklenmesi zorunludur</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sertifika Adı</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Düzenleyici Referans</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingCertificates.map((item: any) => (
                    <TableRow key={item.requirement.id}>
                      <TableCell className="font-medium">{item.requirement.certificate_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.requirement.certificate_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.requirement.regulatory_reference}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleAddMissingCertificate(item.requirement)}
                          disabled={creatingCertificate}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ekle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {missingCertificates.map((item: any) => (
                <div key={item.requirement.id} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium text-sm">{item.requirement.certificate_name}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.requirement.certificate_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.requirement.regulatory_reference}</div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleAddMissingCertificate(item.requirement)}
                    disabled={creatingCertificate}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(expiredCertificates.length > 0 || criticalCertificates.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
              Acil Dikkat Gerektiren Sertifikalar
            </CardTitle>
            <CardDescription className="text-sm">Süresi dolmuş veya dolmak üzere olan sertifikalar</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sertifika Adı</TableHead>
                    <TableHead>Sertifika No</TableHead>
                    <TableHead>Son Kullanma</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...expiredCertificates, ...criticalCertificates].map((item: any) => (
                    <TableRow key={item.certificate.id}>
                      <TableCell className="font-medium">{item.certificate.certificate_name}</TableCell>
                      <TableCell>{item.certificate.certificate_number || "N/A"}</TableCell>
                      <TableCell>{new Date(item.certificate.expires_date).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>
                        {item.status === "expired" ? (
                          <Badge variant="destructive">Süresi Dolmuş</Badge>
                        ) : (
                          <Badge className="bg-orange-600">{item.daysUntilExpiry} gün kaldı</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/ships/${shipId}/certificates`}>Yenile</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {[...expiredCertificates, ...criticalCertificates].map((item: any) => (
                <div key={item.certificate.id} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium text-sm">{item.certificate.certificate_name}</div>
                  <div className="text-xs text-muted-foreground">
                    No: {item.certificate.certificate_number || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Son: {new Date(item.certificate.expires_date).toLocaleDateString("tr-TR")}
                  </div>
                  <div>
                    {item.status === "expired" ? (
                      <Badge variant="destructive" className="text-xs">
                        Süresi Dolmuş
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-600 text-xs">{item.daysUntilExpiry} gün kaldı</Badge>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="w-full bg-transparent" asChild>
                    <Link href={`/dashboard/ships/${shipId}/certificates`}>Yenile</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {warningCertificates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              Uyarı - Yaklaşan Yenilemeler
            </CardTitle>
            <CardDescription className="text-sm">90 gün içinde yenilenmesi gereken sertifikalar</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sertifika Adı</TableHead>
                    <TableHead>Sertifika No</TableHead>
                    <TableHead>Son Kullanma</TableHead>
                    <TableHead>Kalan Süre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warningCertificates.map((item: any) => (
                    <TableRow key={item.certificate.id}>
                      <TableCell className="font-medium">{item.certificate.certificate_name}</TableCell>
                      <TableCell>{item.certificate.certificate_number || "N/A"}</TableCell>
                      <TableCell>{new Date(item.certificate.expires_date).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          {item.daysUntilExpiry} gün
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {warningCertificates.map((item: any) => (
                <div key={item.certificate.id} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium text-sm">{item.certificate.certificate_name}</div>
                  <div className="text-xs text-muted-foreground">
                    No: {item.certificate.certificate_number || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Son: {new Date(item.certificate.expires_date).toLocaleDateString("tr-TR")}
                  </div>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">
                    {item.daysUntilExpiry} gün
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
