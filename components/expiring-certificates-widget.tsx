"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileCheck, Ship, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Certificate {
  id: string
  certificate_name: string
  certificate_type: string
  ship_name: string
  ship_id: string
  expires_date: string
  days_until_expiry: number
  status: string
}

export function ExpiringCertificatesWidget() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all")

  useEffect(() => {
    fetchExpiringCertificates()
  }, [])

  const fetchExpiringCertificates = async () => {
    try {
      const response = await fetch("/api/certificates/expiring")
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching expiring certificates:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCertificateStatus = (days: number) => {
    if (days <= 0) return { label: "Süresi Dolmuş", color: "destructive", priority: 3 }
    if (days <= 7) return { label: "Kritik", color: "destructive", priority: 3 }
    if (days <= 30) return { label: "Acil", color: "destructive", priority: 2 }
    if (days <= 60) return { label: "Uyarı", color: "warning", priority: 1 }
    return { label: "Normal", color: "secondary", priority: 0 }
  }

  const filteredCertificates = certificates.filter((cert) => {
    const status = getCertificateStatus(cert.days_until_expiry)
    if (filter === "critical") return status.priority === 3
    if (filter === "warning") return status.priority >= 1
    return true
  })

  const criticalCount = certificates.filter((c) => getCertificateStatus(c.days_until_expiry).priority === 3).length
  const warningCount = certificates.filter((c) => getCertificateStatus(c.days_until_expiry).priority >= 1).length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Süresi Yaklaşan Sertifikalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Süresi Yaklaşan Sertifikalar
            </CardTitle>
            <CardDescription>90 gün içinde süresi dolacak sertifikalar</CardDescription>
          </div>
          {certificates.length > 0 && (
            <div className="flex gap-2">
              <Badge variant={criticalCount > 0 ? "destructive" : "secondary"} className="text-xs">
                {criticalCount} Kritik
              </Badge>
              <Badge variant={warningCount > 0 ? "outline" : "secondary"} className="text-xs">
                {warningCount} Uyarı
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 w-fit mx-auto mb-3">
              <FileCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium mb-1">Harika!</p>
            <p className="text-xs text-muted-foreground">90 gün içinde süresi dolacak sertifika bulunmuyor</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="text-xs"
              >
                Tümü ({certificates.length})
              </Button>
              <Button
                variant={filter === "critical" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("critical")}
                className="text-xs"
              >
                Kritik ({criticalCount})
              </Button>
              <Button
                variant={filter === "warning" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("warning")}
                className="text-xs"
              >
                Uyarı ({warningCount})
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredCertificates.map((cert) => {
                const status = getCertificateStatus(cert.days_until_expiry)
                return (
                  <Link
                    key={cert.id}
                    href={`/dashboard/ships/${cert.ship_id}?tab=certificates`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 hover:border-primary/20 transition-all group"
                  >
                    <div
                      className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                        status.priority === 3
                          ? "bg-red-50 dark:bg-red-900/20"
                          : status.priority >= 1
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : "bg-blue-50 dark:bg-blue-900/20"
                      }`}
                    >
                      {status.priority === 3 ? (
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">{cert.certificate_name}</p>
                        <Badge variant={status.color as any} className="text-xs shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Ship className="h-3 w-3" />
                        <span className="truncate">{cert.ship_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Son Kullanma: {new Date(cert.expires_date).toLocaleDateString("tr-TR")}
                        </span>
                        <span
                          className={`font-semibold ${
                            cert.days_until_expiry <= 7
                              ? "text-red-600"
                              : cert.days_until_expiry <= 30
                                ? "text-orange-600"
                                : "text-blue-600"
                          }`}
                        >
                          {cert.days_until_expiry <= 0 ? "Süresi dolmuş" : `${cert.days_until_expiry} gün kaldı`}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
