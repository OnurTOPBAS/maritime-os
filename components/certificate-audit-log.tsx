"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, User, Calendar } from "lucide-react"

interface CertificateAuditLogProps {
  certificateId: string
}

export function CertificateAuditLog({ certificateId }: CertificateAuditLogProps) {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [certificateId])

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/audit-log`)
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data)
      }
    } catch (error) {
      console.error("[v0] Fetch audit logs error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return <Badge className="bg-green-600 text-xs">Oluşturuldu</Badge>
      case "updated":
        return <Badge className="bg-blue-600 text-xs">Güncellendi</Badge>
      case "deleted":
        return (
          <Badge variant="destructive" className="text-xs">
            Silindi
          </Badge>
        )
      case "renewed":
        return <Badge className="bg-purple-600 text-xs">Yenilendi</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {action}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderChanges = (changes: any) => {
    if (!changes || Object.keys(changes).length === 0) return null

    const fieldLabels: any = {
      certificate_name: "Sertifika Adı",
      certificate_type: "Sertifika Tipi",
      issued_date: "Verilme Tarihi",
      expires_date: "Son Kullanma Tarihi",
      last_annual_date: "Son Yıllık Tarih",
      last_intermediate_date: "Son Ara Tarih",
      certificate_number: "Sertifika No",
      issuing_authority: "Veren Kurum",
      responsible_person_id: "Sorumlu Kişi",
      status: "Durum",
    }

    return (
      <div className="mt-2 space-y-1">
        {Object.entries(changes).map(([field, change]: [string, any]) => (
          <div key={field} className="text-xs md:text-sm">
            <span className="font-medium">{fieldLabels[field] || field}:</span>
            <span className="text-muted-foreground ml-2 break-words">
              {change.from || "N/A"} → {change.to || "N/A"}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <History className="h-4 w-4 md:h-5 md:w-5" />
          Değişiklik Geçmişi
        </CardTitle>
        <CardDescription className="text-sm">Sertifika üzerinde yapılan tüm değişiklikler</CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Henüz değişiklik kaydı yok</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] md:h-[400px] pr-2 md:pr-4">
            <div className="space-y-3 md:space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">{getActionBadge(log.action)}</div>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm mb-2">
                    <User className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{log.user_name || "Bilinmeyen Kullanıcı"}</span>
                    <span className="text-muted-foreground truncate hidden sm:inline">({log.user_email})</span>
                  </div>
                  {log.changes && renderChanges(log.changes)}
                  {log.ip_address && <div className="text-xs text-muted-foreground mt-2">IP: {log.ip_address}</div>}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
