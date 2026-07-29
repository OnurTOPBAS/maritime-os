"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2 } from "lucide-react"

interface DocumentUploadProps {
  shipId?: string
  fixtureId?: string
  invoiceId?: string
  onUploadComplete?: () => void
}

export function DocumentUpload({ shipId, fixtureId, invoiceId, onUploadComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !category) return

    setUploading(true)

    try {
      console.log("[v0] Uploading document with params:", { shipId, fixtureId, invoiceId, category })

      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)
      if (shipId) formData.append("shipId", shipId)
      if (fixtureId) formData.append("fixtureId", fixtureId)
      if (invoiceId) formData.append("invoiceId", invoiceId)
      if (description) formData.append("description", description)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Upload response status:", response.status)
      console.log("[v0] Upload response content-type:", response.headers.get("content-type"))

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Expected JSON but got:", text.substring(0, 200))
        throw new Error(
          "Sunucu beklenmeyen bir yanıt döndürdü. Lütfen documents tablosunun oluşturulduğundan emin olun.",
        )
      }

      const result = await response.json()
      console.log("[v0] Upload result:", result)

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      console.log("[v0] Upload successful:", result)

      // Reset form
      setFile(null)
      setCategory("")
      setDescription("")

      if (onUploadComplete) {
        onUploadComplete()
      }

      alert("Dosya başarıyla yüklendi!")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert(error instanceof Error ? error.message : "Dosya yüklenirken hata oluştu")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Dosya</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        {file && (
          <p className="text-sm text-muted-foreground mt-1">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="category">Kategori</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Kategori seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="charter_party">Charter Party</SelectItem>
            <SelectItem value="certificate">Sertifika</SelectItem>
            <SelectItem value="invoice">Fatura</SelectItem>
            <SelectItem value="other">Diğer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dosya hakkında notlar..."
        />
      </div>

      <Button type="submit" disabled={!file || !category || uploading}>
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Yükleniyor...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Dosya Yükle
          </>
        )}
      </Button>
    </form>
  )
}
