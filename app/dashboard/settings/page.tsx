"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, Save, Globe, Palette } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    laycanAlerts: true,
    reminderDays: 7,
    laycanDays: 3,
  })

  const [userPreferences, setUserPreferences] = useState({
    theme: "system",
    language: "tr",
    timezone: "Europe/Istanbul",
    date_format: "DD/MM/YYYY",
    time_format: "24h",
    currency: "USD",
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          router.push("/auth/signin")
          return
        }
        const data = await response.json()
        setUser(data.user)

        const prefsRes = await fetch("/api/user-preferences")
        if (prefsRes.ok) {
          const prefs = await prefsRes.json()
          setUserPreferences(prefs)
          if (prefs.theme) {
            setTheme(prefs.theme)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
        router.push("/auth/signin")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router, setTheme])

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Ayarlar kaydedildi",
        description: "Bildirim ayarlarınız başarıyla güncellendi.",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPreferences),
      })

      if (res.ok) {
        setTheme(userPreferences.theme)
        toast({
          title: "Tercihler kaydedildi",
          description: "Kullanıcı tercihleriniz başarıyla güncellendi.",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Tercihler kaydedilemedi.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestReminders = async () => {
    try {
      const response = await fetch("/api/notifications/send-reminders", { method: "POST" })
      const data = await response.json()
      toast({
        title: "Hatırlatmalar gönderildi",
        description: `${data.invoiceReminders} fatura hatırlatması ve ${data.laycanAlerts} laycan uyarısı gönderildi.`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hatırlatmalar gönderilemedi.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ayarlar</h1>
          <p className="text-muted-foreground">Bildirim ve sistem ayarlarınızı yönetin</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Bildirimler
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Palette className="h-4 w-4 mr-2" />
              Tercihler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Bildirim Ayarları
                </CardTitle>
                <CardDescription>Email bildirimleri ve hatırlatmaları yapılandırın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">Tüm email bildirimlerini etkinleştir</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Fatura Hatırlatmaları</Label>
                    <p className="text-sm text-muted-foreground">Vadesi yaklaşan faturalar için hatırlatma gönder</p>
                  </div>
                  <Switch
                    checked={notificationSettings.invoiceReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, invoiceReminders: checked })
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fatura Hatırlatma Süresi (gün)</Label>
                  <Input
                    type="number"
                    value={notificationSettings.reminderDays}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        reminderDays: Number.parseInt(e.target.value),
                      })
                    }
                    disabled={!notificationSettings.emailNotifications || !notificationSettings.invoiceReminders}
                  />
                  <p className="text-sm text-muted-foreground">Vade tarihinden kaç gün önce hatırlatma gönderilsin</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Laycan Uyarıları</Label>
                    <p className="text-sm text-muted-foreground">Yaklaşan laycan tarihleri için uyarı gönder</p>
                  </div>
                  <Switch
                    checked={notificationSettings.laycanAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, laycanAlerts: checked })
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Laycan Uyarı Süresi (gün)</Label>
                  <Input
                    type="number"
                    value={notificationSettings.laycanDays}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, laycanDays: Number.parseInt(e.target.value) })
                    }
                    disabled={!notificationSettings.emailNotifications || !notificationSettings.laycanAlerts}
                  />
                  <p className="text-sm text-muted-foreground">Laycan tarihinden kaç gün önce uyarı gönderilsin</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                  <Button variant="outline" onClick={handleTestReminders}>
                    <Mail className="h-4 w-4 mr-2" />
                    Test Hatırlatmaları Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Görünüm Tercihleri
                </CardTitle>
                <CardDescription>Tema ve görünüm ayarlarınızı özelleştirin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={userPreferences.theme}
                    onValueChange={(value) => {
                      setUserPreferences({ ...userPreferences, theme: value })
                      setTheme(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Açık</SelectItem>
                      <SelectItem value="dark">Koyu</SelectItem>
                      <SelectItem value="system">Sistem</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Tema değişikliği anında uygulanır</p>
                </div>

                <div className="space-y-2">
                  <Label>Para Birimi</Label>
                  <Select
                    value={userPreferences.currency}
                    onValueChange={(value) => setUserPreferences({ ...userPreferences, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="TRY">TRY (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Bölge ve Dil
                </CardTitle>
                <CardDescription>Dil, saat dilimi ve tarih formatı ayarları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Dil</Label>
                  <Select
                    value={userPreferences.language}
                    onValueChange={(value) => setUserPreferences({ ...userPreferences, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Saat Dilimi</Label>
                  <Select
                    value={userPreferences.timezone}
                    onValueChange={(value) => setUserPreferences({ ...userPreferences, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Istanbul">İstanbul (GMT+3)</SelectItem>
                      <SelectItem value="Europe/London">Londra (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapur (GMT+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tarih Formatı</Label>
                  <Select
                    value={userPreferences.date_format}
                    onValueChange={(value) => setUserPreferences({ ...userPreferences, date_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Saat Formatı</Label>
                  <Select
                    value={userPreferences.time_format}
                    onValueChange={(value) => setUserPreferences({ ...userPreferences, time_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Saat</SelectItem>
                      <SelectItem value="12h">12 Saat (AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Tercihleri Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
