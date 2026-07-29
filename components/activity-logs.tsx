"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, FileEdit, Trash2, Plus } from "lucide-react"

interface AuditLog {
  id: string
  user_name: string
  user_email: string
  entity_type: string
  action: string
  changes: any
  created_at: string
}

interface ActivityLogsProps {
  entityType?: string
  entityId?: string
  limit?: number
}

export function ActivityLogs({ entityType, entityId, limit = 20 }: ActivityLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [entityType, entityId])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (entityType) params.append("entityType", entityType)
      if (entityId) params.append("entityId", entityId)
      params.append("limit", limit.toString())

      const response = await fetch(`/api/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="h-4 w-4" />
      case "update":
        return <FileEdit className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-500/10 text-green-500"
      case "update":
        return "bg-blue-500/10 text-blue-500"
      case "delete":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case "create":
        return "Oluşturdu"
      case "update":
        return "Güncelledi"
      case "delete":
        return "Sildi"
      default:
        return action
    }
  }

  const getEntityTypeText = (type: string) => {
    const types: Record<string, string> = {
      company: "Şirket",
      fleet: "Filo",
      ship: "Gemi",
      fixture: "Fixture",
      voyage: "Sefer",
      invoice: "Fatura",
      document: "Doküman",
    }
    return types[type] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Az önce"
    if (diffMins < 60) return `${diffMins} dakika önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    if (diffDays < 7) return `${diffDays} gün önce`

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktivite Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aktivite Geçmişi</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz aktivite kaydı yok.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>{getActionIcon(log.action)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{log.user_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getEntityTypeText(log.entity_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{getActionText(log.action)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
