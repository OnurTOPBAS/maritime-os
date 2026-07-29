"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Trash2, Plus, Eye, Edit, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToastNotification } from "@/components/toast-provider"

interface Document {
  id: string
  filename: string
  original_filename: string
  file_url: string
  file_type: string
  file_size: number
  category: string
  port?: string
  description?: string
  document_date?: string
  created_at: string
}

interface VoyageDocumentsTabProps {
  voyageId: string
  loadingPorts: any[]
  dischargePorts: any[]
}

export function VoyageDocumentsTab({ voyageId, loadingPorts, dischargePorts }: VoyageDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const toast = useToastNotification()

  useEffect(() => {
    fetchDocuments()
  }, [voyageId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/voyages/${voyageId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileUpload = async (file: File, metadata?: any) => {
    setUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload failed")
      }

      const blob = await uploadResponse.json()

      const response = await fetch(`/api/voyages/${voyageId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: blob.pathname,
          original_filename: file.name,
          file_url: blob.url,
          file_type: file.type,
          file_size: file.size,
          category: metadata?.category || "other",
          port: metadata?.port || "general",
          description: metadata?.description || "",
        }),
      })

      if (response.ok) {
        toast.success("Başarılı", "Döküman yüklendi")
        setUploadDialogOpen(false)
        fetchDocuments()
      } else {
        toast.error("Hata", "Döküman yüklenemedi")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error("Hata", "Döküman yüklenirken bir hata oluştu")
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const formData = new FormData(e.currentTarget)
      const file = formData.get("file") as File
      const port = formData.get("port") as string
      const category = formData.get("category") as string
      const description = formData.get("description") as string

      if (!file) {
        toast.error("Hata", "Lütfen bir dosya seçin")
        return
      }

      await handleFileUpload(file, { port, category, description })
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error("Hata", "Döküman yüklenirken bir hata oluştu")
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedDocument) return

    try {
      const formData = new FormData(e.currentTarget)
      const port = formData.get("port") as string
      const category = formData.get("category") as string
      const description = formData.get("description") as string

      const response = await fetch(`/api/voyages/${voyageId}/documents/${selectedDocument.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port,
          category,
          description,
        }),
      })

      if (response.ok) {
        toast.success("Başarılı", "Döküman güncellendi")
        setEditDialogOpen(false)
        setSelectedDocument(null)
        fetchDocuments()
      } else {
        toast.error("Hata", "Döküman güncellenemedi")
      }
    } catch (error) {
      console.error("Error updating document:", error)
      toast.error("Hata", "Döküman güncellenirken bir hata oluştu")
    }
  }

  const handlePreview = (doc: Document) => {
    setSelectedDocument(doc)
    setPreviewDialogOpen(true)
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Bu dökümanı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyages/${voyageId}/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Başarılı", "Döküman silindi")
        fetchDocuments()
      } else {
        toast.error("Hata", "Döküman silinemedi")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error("Hata", "Döküman silinirken bir hata oluştu")
    }
  }

  const groupByPort = () => {
    const grouped: Record<string, Document[]> = {
      Genel: [],
    }

    loadingPorts.forEach((port) => {
      grouped[`Yükleme - ${port.port_name}`] = []
    })

    dischargePorts.forEach((port) => {
      grouped[`Tahliye - ${port.port_name}`] = []
    })

    documents.forEach((doc) => {
      if (!doc.port) {
        grouped["Genel"].push(doc)
      } else {
        const key = Object.keys(grouped).find((k) => k.includes(doc.port!))
        if (key) {
          grouped[key].push(doc)
        } else {
          grouped["Genel"].push(doc)
        }
      }
    })

    return grouped
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const groupedDocuments = groupByPort()

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted"
        }`}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">Dosyaları buraya sürükleyip bırakın veya</p>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Döküman Yükle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Döküman Yükle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">Dosya</Label>
                <Input id="file" name="file" type="file" required />
              </div>
              <div>
                <Label htmlFor="port">Liman</Label>
                <Select name="port">
                  <SelectTrigger>
                    <SelectValue placeholder="Liman seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Genel</SelectItem>
                    {loadingPorts.map((port, idx) => (
                      <SelectItem key={`load-${idx}`} value={port.port_name}>
                        Yükleme - {port.port_name}
                      </SelectItem>
                    ))}
                    {dischargePorts.map((port, idx) => (
                      <SelectItem key={`discharge-${idx}`} value={port.port_name}>
                        Tahliye - {port.port_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>
                    <SelectItem value="charter_party">Charter Party</SelectItem>
                    <SelectItem value="statement_of_facts">Statement of Facts</SelectItem>
                    <SelectItem value="time_sheet">Time Sheet</SelectItem>
                    <SelectItem value="bunker_delivery_note">Bunker Delivery Note</SelectItem>
                    <SelectItem value="invoice">Fatura</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input id="description" name="description" placeholder="Döküman açıklaması" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Yükleniyor..." : "Yükle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Döküman Düzenle</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>Dosya Adı</Label>
                <Input value={selectedDocument.original_filename} disabled />
              </div>
              <div>
                <Label htmlFor="edit-port">Liman</Label>
                <Select name="port" defaultValue={selectedDocument.port || "general"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Genel</SelectItem>
                    {loadingPorts.map((port, idx) => (
                      <SelectItem key={`load-${idx}`} value={port.port_name}>
                        Yükleme - {port.port_name}
                      </SelectItem>
                    ))}
                    {dischargePorts.map((port, idx) => (
                      <SelectItem key={`discharge-${idx}`} value={port.port_name}>
                        Tahliye - {port.port_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-category">Kategori</Label>
                <Select name="category" defaultValue={selectedDocument.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>
                    <SelectItem value="charter_party">Charter Party</SelectItem>
                    <SelectItem value="statement_of_facts">Statement of Facts</SelectItem>
                    <SelectItem value="time_sheet">Time Sheet</SelectItem>
                    <SelectItem value="bunker_delivery_note">Bunker Delivery Note</SelectItem>
                    <SelectItem value="invoice">Fatura</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={selectedDocument.description || ""}
                  placeholder="Döküman açıklaması"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">Kaydet</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.original_filename}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              {selectedDocument.file_type.startsWith("image/") ? (
                <img
                  src={selectedDocument.file_url || "/placeholder.svg"}
                  alt={selectedDocument.original_filename}
                  className="w-full h-auto rounded-lg"
                />
              ) : selectedDocument.file_type === "application/pdf" ? (
                <iframe
                  src={selectedDocument.file_url}
                  className="w-full h-[70vh] rounded-lg"
                  title={selectedDocument.original_filename}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Bu dosya türü önizlenemiyor</p>
                  <Button asChild>
                    <a href={selectedDocument.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-2" />
                      İndir
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {Object.entries(groupedDocuments).map(([port, docs]) => {
        if (docs.length === 0) return null
        return (
          <Card key={port}>
            <CardHeader>
              <CardTitle className="text-lg">{port}</CardTitle>
              <CardDescription>{docs.length} döküman</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.original_filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)} • {doc.category} •{" "}
                          {new Date(doc.created_at).toLocaleDateString("tr-TR")}
                        </p>
                        {doc.description && <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handlePreview(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDocument(doc)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Bu sefer için döküman bulunmuyor</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
