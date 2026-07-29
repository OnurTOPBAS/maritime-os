"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react"

export function AdvancedPermissionManager() {
  const [temporaryPermissions, setTemporaryPermissions] = useState<any[]>([])
  const [permissionRequests, setPermissionRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showGrantDialog, setShowGrantDialog] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tempPerms, requests] = await Promise.all([
        fetch("/api/permissions/temporary").then((r) => r.json()),
        fetch("/api/permissions/requests").then((r) => r.json()),
      ])

      setTemporaryPermissions(tempPerms)
      setPermissionRequests(requests)
    } catch (error) {
      console.error("Failed to fetch permission data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/permissions/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Failed to approve request:", error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/permissions/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Failed to reject request:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gelişmiş Yetki Yönetimi</h2>
          <p className="text-muted-foreground">Geçici yetkiler ve yetki talepleri</p>
        </div>
        <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Geçici Yetki Ver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Geçici Yetki Ver</DialogTitle>
              <DialogDescription>Kullanıcıya belirli bir süre için yetki verin</DialogDescription>
            </DialogHeader>
            {/* TODO: Add form for granting temporary permissions */}
            <p className="text-sm text-muted-foreground">Form yakında eklenecek</p>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="temporary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="temporary">
            <Clock className="mr-2 h-4 w-4" />
            Geçici Yetkiler ({temporaryPermissions.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <AlertCircle className="mr-2 h-4 w-4" />
            Yetki Talepleri ({permissionRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="temporary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geçici Yetkiler</CardTitle>
              <CardDescription>Kullanıcılara verilen geçici yetkiler</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {temporaryPermissions.map((perm) => (
                    <div key={perm.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className={`p-2 rounded-lg ${isExpired(perm.expires_at) ? "bg-red-100" : "bg-green-100"}`}>
                        <Shield
                          className={`h-5 w-5 ${isExpired(perm.expires_at) ? "text-red-600" : "text-green-600"}`}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{perm.user_name}</span>
                          <Badge variant="outline">{perm.module}</Badge>
                          <Badge variant="secondary">{perm.action}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{perm.permission_description}</p>
                        {perm.reason && <p className="text-sm italic">Sebep: {perm.reason}</p>}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Veren: {perm.granted_by_name}</span>
                          <span>Başlangıç: {formatDate(perm.starts_at)}</span>
                          <span className={isExpired(perm.expires_at) ? "text-red-600 font-medium" : ""}>
                            Bitiş: {formatDate(perm.expires_at)}
                          </span>
                        </div>
                      </div>
                      {isExpired(perm.expires_at) ? (
                        <Badge variant="destructive">Süresi Doldu</Badge>
                      ) : (
                        <Badge variant="default">Aktif</Badge>
                      )}
                    </div>
                  ))}
                  {temporaryPermissions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Geçici yetki bulunmuyor</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yetki Talepleri</CardTitle>
              <CardDescription>Kullanıcıların yetki talepleri</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {permissionRequests.map((request) => (
                    <div key={request.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.user_name}</span>
                          <Badge variant="outline">{request.module}</Badge>
                          <Badge variant="secondary">{request.action}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.permission_description}</p>
                        <p className="text-sm">
                          <strong>Sebep:</strong> {request.reason}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Talep Tarihi: {formatDate(request.requested_at)}</span>
                          <span>Süre: {request.duration_days} gün</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => handleApproveRequest(request.id)}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Onayla
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                          <XCircle className="mr-1 h-4 w-4" />
                          Reddet
                        </Button>
                      </div>
                    </div>
                  ))}
                  {permissionRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Bekleyen yetki talebi bulunmuyor</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
