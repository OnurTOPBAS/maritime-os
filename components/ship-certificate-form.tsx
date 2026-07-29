"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { CertificateFilePreview } from "./certificate-file-preview"
import { validateFile } from "@/lib/file-validation"

interface ShipCertificateFormProps {
  shipId: string
  certificate?: any
  onSuccess: (certificate: any) => void
}

const CERTIFICATE_TYPES = [
  { value: "SEC", label: "Safety Equipment Certificate (SEC)" },
  { value: "SRC", label: "Safety Radio Certificate (SRC)" },
  { value: "SCC", label: "Safety Construction Certificate (SCC)" },
  { value: "ILC", label: "International Loadline Certificate (ILC)" },
  { value: "IOPPC", label: "International Oil Pollution Prevention Certificate (IOPPC)" },
  { value: "ISSC", label: "International Ship Security Certificate (ISSC)" },
  { value: "MLC", label: "Maritime Labour Certificate (MLC)" },
  { value: "SMC", label: "ISM Safety Management Certificate (SMC)" },
  { value: "DOC", label: "Document of Compliance (DOC)" },
  { value: "USCGCOC", label: "USCG Certificate of Compliance (USCGCOC)" },
  { value: "CLC", label: "Civil Liability Convention (CLC) 1992 Certificate" },
  { value: "CLBC", label: "Civil Liability for Bunker Oil Pollution Damage Convention (CLBC) Certificate" },
  { value: "WRC", label: "Liability for the Removal of Wrecks Certificate (WRC)" },
  { value: "COFR", label: "U.S. Certificate of Financial Responsibility (COFR)" },
  { value: "COC", label: "Certificate of Class (COC)" },
  { value: "ISPPC", label: "International Sewage Pollution Prevention Certificate (ISPPC)" },
  { value: "COF", label: "Certificate of Fitness (COF)" },
  { value: "IEEC", label: "International Energy Efficiency Certificate (IEEC)" },
  { value: "IAPPC", label: "International Air Pollution Prevention Certificate (IAPPC)" },
]

export function ShipCertificateForm({ shipId, certificate, onSuccess }: ShipCertificateFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState(certificate?.file_url || "")
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    try {
      // If it's already in YYYY-MM-DD format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
      }
      // Parse the date string (handles both ISO timestamps and date strings)
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""

      // Format as YYYY-MM-DD using local date components to avoid timezone shifts
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    } catch (error) {
      console.error("[v0] Error formatting date:", dateString, error)
      return ""
    }
  }

  const [formData, setFormData] = useState({
    certificate_name: certificate?.certificate_name || "",
    certificate_type: certificate?.certificate_type || "SEC",
    issued_date: formatDateForInput(certificate?.issued_date),
    last_annual_date: formatDateForInput(certificate?.last_annual_date),
    last_intermediate_date: formatDateForInput(certificate?.last_intermediate_date),
    expires_date: formatDateForInput(certificate?.expires_date),
    issuing_authority: certificate?.issuing_authority || "",
    certificate_number: certificate?.certificate_number || "",
    notes: certificate?.notes || "",
    status: certificate?.status || "valid",
    responsible_person_id: certificate?.responsible_person_id || "",
    notify_90_days: certificate?.notify_90_days !== false,
    notify_60_days: certificate?.notify_60_days !== false,
    notify_30_days: certificate?.notify_30_days !== false,
    notify_15_days: certificate?.notify_15_days !== false,
    notify_7_days: certificate?.notify_7_days !== false,
  })

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const teamRes = await fetch(`/api/ships/${shipId}/team`)
        if (!teamRes.ok) {
          console.error("[v0] Failed to fetch team members")
          return
        }
        const teamData = await teamRes.json()
        setTeamMembers(teamData.teamMembers || [])
      } catch (err) {
        console.error("[v0] Error fetching team members:", err)
      }
    }

    fetchTeamMembers()
  }, [shipId])

  useEffect(() => {
    if (certificate) {
      console.log("[v0] Certificate prop updated, formatting dates:", {
        issued_date: certificate.issued_date,
        expires_date: certificate.expires_date,
        last_annual_date: certificate.last_annual_date,
        last_intermediate_date: certificate.last_intermediate_date,
      })

      const formattedDates = {
        issued_date: formatDateForInput(certificate.issued_date),
        expires_date: formatDateForInput(certificate.expires_date),
        last_annual_date: formatDateForInput(certificate.last_annual_date),
        last_intermediate_date: formatDateForInput(certificate.last_intermediate_date),
      }

      console.log("[v0] Formatted dates for form:", formattedDates)

      setFormData({
        certificate_name: certificate.certificate_name || "",
        certificate_type: certificate.certificate_type || "SEC",
        issued_date: formattedDates.issued_date,
        last_annual_date: formattedDates.last_annual_date,
        last_intermediate_date: formattedDates.last_intermediate_date,
        expires_date: formattedDates.expires_date,
        issuing_authority: certificate.issuing_authority || "",
        certificate_number: certificate.certificate_number || "",
        notes: certificate.notes || "",
        status: certificate.status || "valid",
        responsible_person_id: certificate.responsible_person_id || "",
        notify_90_days: certificate.notify_90_days !== false,
        notify_60_days: certificate.notify_60_days !== false,
        notify_30_days: certificate.notify_30_days !== false,
        notify_15_days: certificate.notify_15_days !== false,
        notify_7_days: certificate.notify_7_days !== false,
      })
      setFileUrl(certificate.file_url || "")
    }
  }, [certificate])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      toast({
        title: "Geçersiz dosya",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFileUrl(data.url)
        toast({
          title: "Dosya yüklendi",
          description: "Sertifika dosyası başarıyla yüklendi",
        })
      }
    } catch (error) {
      console.error("[v0] File upload error:", error)
      toast({
        title: "Hata",
        description: "Dosya yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Submitting certificate with dates:", {
        issued_date: formData.issued_date,
        expires_date: formData.expires_date,
        last_annual_date: formData.last_annual_date,
        last_intermediate_date: formData.last_intermediate_date,
      })

      const url = certificate
        ? `/api/ships/${shipId}/certificates/${certificate.id}`
        : `/api/ships/${shipId}/certificates`

      const response = await fetch(url, {
        method: certificate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          file_url: fileUrl || null,
          issued_date: formData.issued_date || null,
          expires_date: formData.expires_date || null,
          last_annual_date: formData.last_annual_date || null,
          last_intermediate_date: formData.last_intermediate_date || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Certificate saved, received dates:", {
          issued_date: data.issued_date,
          expires_date: data.expires_date,
          last_annual_date: data.last_annual_date,
          last_intermediate_date: data.last_intermediate_date,
        })
        toast({
          title: certificate ? "Sertifika güncellendi" : "Sertifika eklendi",
          description: "İşlem başarıyla tamamlandı",
        })
        onSuccess(data)
      } else {
        throw new Error("Failed to save certificate")
      }
    } catch (error) {
      console.error("[v0] Save certificate error:", error)
      toast({
        title: "Hata",
        description: "Sertifika kaydedilirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="certificate_type">Sertifika Tipi *</Label>
          <Select
            value={formData.certificate_type}
            onValueChange={(value) => {
              const selected = CERTIFICATE_TYPES.find((t) => t.value === value)
              setFormData({
                ...formData,
                certificate_type: value,
                certificate_name: selected?.label || "",
              })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sertifika tipi seçin" />
            </SelectTrigger>
            <SelectContent>
              {CERTIFICATE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificate_name">Sertifika Adı *</Label>
          <Input
            id="certificate_name"
            value={formData.certificate_name}
            onChange={(e) => setFormData({ ...formData, certificate_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificate_number">Sertifika Numarası</Label>
          <Input
            id="certificate_number"
            value={formData.certificate_number}
            onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuing_authority">Veren Kurum</Label>
          <Input
            id="issuing_authority"
            value={formData.issuing_authority}
            onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issued_date">Verilme Tarihi</Label>
          <Input
            id="issued_date"
            type="date"
            value={formData.issued_date}
            onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expires_date">Son Kullanma Tarihi</Label>
          <Input
            id="expires_date"
            type="date"
            value={formData.expires_date}
            onChange={(e) => setFormData({ ...formData, expires_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_annual_date">Son Yıllık Muayene</Label>
          <Input
            id="last_annual_date"
            type="date"
            value={formData.last_annual_date}
            onChange={(e) => setFormData({ ...formData, last_annual_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_intermediate_date">Son Ara Muayene</Label>
          <Input
            id="last_intermediate_date"
            type="date"
            value={formData.last_intermediate_date}
            onChange={(e) => setFormData({ ...formData, last_intermediate_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Durum</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="valid">Geçerli</SelectItem>
              <SelectItem value="expiring_soon">Yakında Sona Erecek</SelectItem>
              <SelectItem value="expired">Süresi Dolmuş</SelectItem>
              <SelectItem value="not_applicable">Geçerli Değil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Sertifika Dosyası</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            disabled={uploading}
            className="flex-1"
          />
          {uploading && <span className="text-sm text-muted-foreground">Yükleniyor...</span>}
        </div>
        {fileUrl && <CertificateFilePreview fileUrl={fileUrl} />}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Bildirim Ayarları</h3>

        <div className="space-y-2">
          <Label htmlFor="responsible_person_id">Sorumlu Kişi</Label>
          <Select
            value={formData.responsible_person_id || "none"}
            onValueChange={(value) =>
              setFormData({ ...formData, responsible_person_id: value === "none" ? "" : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sorumlu kişi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Seçilmedi</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Hatırlatma Gönder</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_90"
                checked={formData.notify_90_days}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_90_days: checked as boolean })}
              />
              <label htmlFor="notify_90" className="text-sm cursor-pointer">
                90 gün öncesinde
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_60"
                checked={formData.notify_60_days}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_60_days: checked as boolean })}
              />
              <label htmlFor="notify_60" className="text-sm cursor-pointer">
                60 gün öncesinde
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_30"
                checked={formData.notify_30_days}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_30_days: checked as boolean })}
              />
              <label htmlFor="notify_30" className="text-sm cursor-pointer">
                30 gün öncesinde
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_15"
                checked={formData.notify_15_days}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_15_days: checked as boolean })}
              />
              <label htmlFor="notify_15" className="text-sm cursor-pointer">
                15 gün öncesinde
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_7"
                checked={formData.notify_7_days}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_7_days: checked as boolean })}
              />
              <label htmlFor="notify_7" className="text-sm cursor-pointer">
                7 gün öncesinde
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Kaydediliyor..." : certificate ? "Güncelle" : "Ekle"}
        </Button>
      </div>
    </form>
  )
}
