"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

interface ActivityLog {
  id: string
  user_name: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  created_at: string
}

interface UserActivityLogProps {
  companyId: string
}

export function UserActivityLog({ companyId }: UserActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [companyId])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/audit-logs?companyId=${companyId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setActivities(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      create: "default",
      update: "secondary",
      delete: "destructive",
    }
    return <Badge variant={variants[action] || "secondary"}>{action}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Kullanıcı Aktiviteleri
        </CardTitle>
        <CardDescription>Son kullanıcı işlemleri ve değişiklikler</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>İşlem</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Detaylar</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Aktivite bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.user_name}</TableCell>
                    <TableCell>{getActionBadge(activity.action)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.entity_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {activity.details ? JSON.stringify(activity.details).substring(0, 50) + "..." : "-"}
                    </TableCell>
                    <TableCell>{new Date(activity.created_at).toLocaleString("tr-TR")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
