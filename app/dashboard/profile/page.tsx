"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Lock, Monitor, UserCog, ShieldCheck } from "lucide-react"
import { SessionManager } from "@/components/session-manager"
import { EnhancedProfileForm } from "@/components/enhanced-profile-form"
import { MyPermissions } from "@/components/my-permissions"

export const dynamic = "force-dynamic"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [profileData, setProfileData] = useState<any>(null)

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const [userResponse, profileResponse] = await Promise.all([fetch("/api/auth/me"), fetch("/api/profile")])

      if (userResponse.ok && profileResponse.ok) {
        const userData = await userResponse.json()
        const profileData = await profileResponse.json()

        setUser(userData)
        setProfileData(profileData)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (data: any) => {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Profil güncellenemedi")
    }

    const updated = await response.json()
    setProfileData(updated)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Yeni şifreler eşleşmiyor")
      setSaving(false)
      return
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Şifre başarıyla güncellendi")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setError(data.error || "Şifre güncellenemedi")
      }
    } catch (err) {
      setError("Bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user || !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profil Ayarları</h1>
          <p className="text-muted-foreground">Hesap bilgilerinizi ve tercihlerinizi yönetin.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">
              <UserCog className="mr-2 h-4 w-4" />
              Gelişmiş Profil
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="mr-2 h-4 w-4" />
              Şifre Değiştir
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Yetkilerim
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Monitor className="mr-2 h-4 w-4" />
              Oturumlar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <EnhancedProfileForm initialData={profileData} onSave={handleSaveProfile} />
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Şifre Değiştir</CardTitle>
                <CardDescription>Hesabınızın güvenliği için güçlü bir şifre kullanın.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="newPassword">Yeni Şifre</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="En az 8 karakter"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Yeni şifrenizi tekrar girin"
                      required
                    />
                  </div>

                  {message && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                      {message}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">{error}</div>
                  )}

                  <Button type="submit" disabled={saving}>
                    {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <MyPermissions />
          </TabsContent>

          <TabsContent value="sessions">
            <SessionManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
