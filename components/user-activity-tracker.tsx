"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  id: string
  name: string
  email: string
}

interface ActivityLog {
  id: string
  user_name: string
  user_email: string
  entity_type: string
  entity_id: string
  action: string
  created_at: string
}

interface UserActivityTrackerProps {
  companyId: string
}

export function UserActivityTracker({ companyId }: UserActivityTrackerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("all")
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [companyId])

  useEffect(() => {
    loadActivities()
  }, [selectedUserId])

  const loadUsers = async () => {
    try {
      const response = await fetch(`/api/users?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const loadActivities = async () => {
    try {
      setLoading(true)
      const url =
        selectedUserId === "all" ? "/api/audit-logs?limit=100" : `/api/audit-logs?userId=${selectedUserId}&limit=100`

      const response = await fetch(url)
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
    switch (action) {
      case "create":
        return <Badge variant="default">Oluşturma</Badge>
      case "update":
        return <Badge variant="secondary">Güncelleme</Badge>
      case "delete":
        return <Badge variant="destructive">Silme</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      ship: "Gemi",
      fixture: "Fixture",
      voyage: "Sefer",
      invoice: "Fatura",
      company: "Şirket",
      fleet: "Filo",
    }
    return labels[entityType] || entityType
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Aktivite Raporu</CardTitle>
          <CardDescription>Kullanıcıların sistem üzerindeki tüm işlemlerini görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Kullanıcı seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Varlık Tipi</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Aktivite bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.user_name}</div>
                          <div className="text-sm text-muted-foreground">{activity.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(activity.action)}</TableCell>
                      <TableCell>{getEntityTypeLabel(activity.entity_type)}</TableCell>
                      <TableCell>{new Date(activity.created_at).toLocaleString("tr-TR")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
