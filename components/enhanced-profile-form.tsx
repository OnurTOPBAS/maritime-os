"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Upload, User, Briefcase, Globe, Bell, FileSignature } from "lucide-react"

interface ProfileData {
  name: string
  email: string
  phone?: string
  position?: string
  department?: string
  birth_date?: string
  address?: string
  bio?: string
  profile_photo_url?: string
  signature_url?: string
  linkedin_url?: string
  twitter_url?: string
  timezone?: string
  language?: string
  notification_email?: boolean
  notification_push?: boolean
  notification_sms?: boolean
  profile_completion?: number
}

interface EnhancedProfileFormProps {
  initialData: ProfileData
  onSave: (data: ProfileData) => Promise<void>
}

export function EnhancedProfileForm({ initialData, onSave }: EnhancedProfileFormProps) {
  const [profileData, setProfileData] = useState<ProfileData>(initialData)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Dosya boyutu 5MB'dan küçük olmalıdır")
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Sadece resim dosyaları yüklenebilir")
      return
    }

    try {
      setUploadingPhoto(true)
      setError("")

      console.log("[v0] Uploading profile photo:", file.name, file.size)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/profile-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url } = await response.json()
      console.log("[v0] Profile photo uploaded:", url)

      setProfileData({ ...profileData, profile_photo_url: url })
      setMessage("Profil fotoğrafı yüklendi")
    } catch (err) {
      console.error("[v0] Error uploading photo:", err)
      setError("Fotoğraf yüklenemedi: " + (err instanceof Error ? err.message : "Bilinmeyen hata"))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError("Dosya boyutu 2MB'dan küçük olmalıdır")
      return
    }

    try {
      setUploadingSignature(true)
      setError("")

      console.log("[v0] Uploading signature:", file.name, file.size)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/signature", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url } = await response.json()
      console.log("[v0] Signature uploaded:", url)

      setProfileData({ ...profileData, signature_url: url })
      setMessage("İmza yüklendi")
    } catch (err) {
      console.error("[v0] Error uploading signature:", err)
      setError("İmza yüklenemedi: " + (err instanceof Error ? err.message : "Bilinmeyen hata"))
    } finally {
      setUploadingSignature(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")

    try {
      await onSave(profileData)
      setMessage("Profil başarıyla güncellendi")
    } catch (err) {
      setError("Profil güncellenemedi")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    return profileData.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Tamamlanma</CardTitle>
          <CardDescription>Profilinizi tamamlayarak daha iyi bir deneyim yaşayın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tamamlanma Oranı</span>
              <span className="font-medium">{profileData.profile_completion || 0}%</span>
            </div>
            <Progress value={profileData.profile_completion || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Fotoğrafı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileData.profile_photo_url || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Upload className="h-4 w-4" />
                  {uploadingPhoto ? "Yükleniyor..." : "Fotoğraf Yükle"}
                </div>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </Label>
              <p className="text-xs text-muted-foreground">JPG, PNG veya GIF. Maksimum 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Kişisel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">İsim Soyisim *</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone || ""}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+90 555 123 4567"
              />
            </div>
            <div>
              <Label htmlFor="birth_date">Doğum Tarihi</Label>
              <Input
                id="birth_date"
                type="date"
                value={profileData.birth_date || ""}
                onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="position">Pozisyon</Label>
              <Input
                id="position"
                value={profileData.position || ""}
                onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                placeholder="Örn: Fleet Manager"
              />
            </div>
            <div>
              <Label htmlFor="department">Departman</Label>
              <Input
                id="department"
                value={profileData.department || ""}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                placeholder="Örn: Operations"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              value={profileData.address || ""}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="bio">Biyografi</Label>
            <Textarea
              id="bio"
              value={profileData.bio || ""}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              rows={3}
              placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            İmza
          </CardTitle>
          <CardDescription>Dökümanlar için kullanılacak imzanızı yükleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileData.signature_url && (
            <div className="border rounded-md p-4 bg-muted/50">
              <img src={profileData.signature_url || "/placeholder.svg"} alt="İmza" className="h-16 object-contain" />
            </div>
          )}
          <Label htmlFor="signature-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 w-fit">
              <Upload className="h-4 w-4" />
              {uploadingSignature ? "Yükleniyor..." : "İmza Yükle"}
            </div>
            <Input
              id="signature-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureUpload}
              disabled={uploadingSignature}
            />
          </Label>
          <p className="text-xs text-muted-foreground">PNG veya JPG. Maksimum 2MB. Şeffaf arka plan önerilir.</p>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sosyal Medya
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              value={profileData.linkedin_url || ""}
              onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/kullaniciadi"
            />
          </div>
          <div>
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              type="url"
              value={profileData.twitter_url || ""}
              onChange={(e) => setProfileData({ ...profileData, twitter_url: e.target.value })}
              placeholder="https://twitter.com/kullaniciadi"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tercihler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Saat Dilimi</Label>
              <Select
                value={profileData.timezone || "Europe/Istanbul"}
                onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Istanbul">İstanbul (GMT+3)</SelectItem>
                  <SelectItem value="Europe/London">Londra (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapur (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Dil</Label>
              <Select
                value={profileData.language || "tr"}
                onValueChange={(value) => setProfileData({ ...profileData, language: value })}
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
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium">Bildirim Tercihleri</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="notification_email" className="cursor-pointer">
                Email Bildirimleri
              </Label>
              <Switch
                id="notification_email"
                checked={profileData.notification_email ?? true}
                onCheckedChange={(checked) => setProfileData({ ...profileData, notification_email: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notification_push" className="cursor-pointer">
                Push Bildirimleri
              </Label>
              <Switch
                id="notification_push"
                checked={profileData.notification_push ?? true}
                onCheckedChange={(checked) => setProfileData({ ...profileData, notification_push: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notification_sms" className="cursor-pointer">
                SMS Bildirimleri
              </Label>
              <Switch
                id="notification_sms"
                checked={profileData.notification_sms ?? false}
                onCheckedChange={(checked) => setProfileData({ ...profileData, notification_sms: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">{message}</div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">{error}</div>}

      {/* Submit Button */}
      <Button type="submit" disabled={saving || uploadingPhoto || uploadingSignature} size="lg">
        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
      </Button>
    </form>
  )
}
