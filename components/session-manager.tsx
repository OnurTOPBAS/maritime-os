"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, Smartphone, Tablet, MapPin, Clock, LogOut, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

interface Session {
  id: number
  session_token: string
  ip_address: string
  user_agent: string
  last_active: string
  created_at: string
  expires_at: string
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [featureUnavailable, setFeatureUnavailable] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      console.log("[v0] Loading sessions...")
      const response = await fetch("/api/sessions")
      console.log("[v0] Sessions response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Sessions data:", data)

        if (data.tableNotExists) {
          setFeatureUnavailable(true)
          setSessions([])
        } else if (Array.isArray(data)) {
          console.log("[v0] Sessions loaded:", data.length)
          setSessions(data)
        } else if (data.sessions) {
          console.log("[v0] Sessions loaded from sessions property:", data.sessions.length)
          setSessions(data.sessions)
        } else {
          console.log("[v0] No sessions found in response")
          setSessions([])
        }
      } else {
        console.error("[v0] Failed to load sessions:", response.statusText)
        setSessions([])
      }
    } catch (error) {
      console.error("[v0] Error loading sessions:", error)
      toast.error("Oturumlar yüklenirken hata oluştu")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutSession = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Oturum sonlandırıldı")
        loadSessions()
      } else {
        toast.error("Oturum sonlandırılırken hata oluştu")
      }
    } catch (error) {
      console.error("[v0] Error logging out session:", error)
      toast.error("Oturum sonlandırılırken hata oluştu")
    }
  }

  const handleLogoutAll = async () => {
    if (!confirm("Diğer tüm cihazlardan çıkış yapmak istediğinizden emin misiniz?")) {
      return
    }

    try {
      const response = await fetch("/api/sessions?logoutAll=true", {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Tüm diğer oturumlar sonlandırıldı")
        loadSessions()
      } else {
        toast.error("Oturumlar sonlandırılırken hata oluştu")
      }
    } catch (error) {
      console.error("[v0] Error logging out all sessions:", error)
      toast.error("Oturumlar sonlandırılırken hata oluştu")
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  const getDeviceInfo = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("chrome")) return "Chrome"
    if (ua.includes("firefox")) return "Firefox"
    if (ua.includes("safari")) return "Safari"
    if (ua.includes("edge")) return "Edge"
    return "Bilinmeyen Tarayıcı"
  }

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>
  }

  if (featureUnavailable) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Oturum Yönetimi Henüz Aktif Değil</p>
              <p className="text-sm">
                Bu özellik şu anda kullanılamıyor. Oturum yönetimi özelliğini kullanmak için veritabanı
                yapılandırmasının tamamlanması gerekiyor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Aktif Oturumlar</h3>
          <p className="text-sm text-muted-foreground">Hesabınıza bağlı tüm cihazları görüntüleyin ve yönetin</p>
        </div>
        {sessions.length > 1 && (
          <Button variant="destructive" onClick={handleLogoutAll}>
            <LogOut className="mr-2 h-4 w-4" />
            Diğer Tüm Oturumları Sonlandır
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {sessions.map((session, index) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.user_agent)}
                  <div>
                    <CardTitle className="text-base">
                      {getDeviceInfo(session.user_agent)}
                      {index === 0 && (
                        <Badge variant="secondary" className="ml-2">
                          Mevcut Oturum
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.ip_address || "Bilinmeyen"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.last_active), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                {index !== 0 && (
                  <Button variant="ghost" size="sm" onClick={() => handleLogoutSession(session.id)}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <div className="space-y-2">
              <p>Aktif oturum bulunamadı</p>
              <p className="text-xs">
                Oturum bilgileri henüz kaydedilmemiş olabilir. Sayfayı yenileyip tekrar deneyin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
