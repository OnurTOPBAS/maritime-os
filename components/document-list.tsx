"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Trash2, Loader2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DocumentUpload } from "./document-upload"

interface Document {
  id: string
  filename: string
  original_filename: string
  file_url: string
  file_size: number
  file_type: string
  category: string
  description: string | null
  uploaded_by_name: string | null
  created_at: string
}

interface InvoiceAttachment {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

interface DocumentListProps {
  shipId?: string
  fixtureId?: string
  invoiceId?: string
}

const categoryLabels: Record<string, string> = {
  charter_party: "Charter Party",
  certificate: "Sertifika",
  invoice: "Fatura",
  other: "Diğer",
}

export function DocumentList({ shipId, fixtureId, invoiceId }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | InvoiceAttachment | null>(null)

  const fetchDocuments = async () => {
    try {
      console.log("[v0] Fetching documents with params:", { shipId, fixtureId, invoiceId })

      if (invoiceId) {
        const response = await fetch(`/api/invoice-attachments?invoiceId=${invoiceId}`)
        const data = await response.json()
        console.log("[v0] Invoice attachments fetched:", data)

        // Transform invoice attachments to match document interface
        const transformedDocs = (data || []).map((att: InvoiceAttachment) => ({
          id: att.id,
          filename: att.file_name,
          original_filename: att.file_name,
          file_url: att.file_url,
          file_size: att.file_size,
          file_type: att.file_type,
          category: "invoice",
          description: null,
          uploaded_by_name: null,
          created_at: att.created_at,
        }))
        setDocuments(transformedDocs)
      } else {
        const params = new URLSearchParams()
        if (shipId) params.append("shipId", shipId)
        if (fixtureId) params.append("fixtureId", fixtureId)

        const response = await fetch(`/api/documents?${params}`)
        const data = await response.json()
        console.log("[v0] Documents fetched:", data)
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [shipId, fixtureId, invoiceId])

  const handleDelete = async (id: string) => {
    if (!confirm("Bu dosyayı silmek istediğinizden emin misiniz?")) return

    setDeleting(id)
    try {
      const endpoint = invoiceId ? `/api/invoice-attachments/${id}` : `/api/documents/${id}`
      const response = await fetch(endpoint, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      await fetchDocuments()
    } catch (error) {
      console.error("Delete error:", error)
      alert("Dosya silinirken hata oluştu")
    } finally {
      setDeleting(null)
    }
  }

  const handleUploadComplete = () => {
    setUploadDialogOpen(false)
    fetchDocuments()
  }

  const canPreview = (doc: Document | InvoiceAttachment) => {
    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/svg+xml", "image/webp"]
    const pdfTypes = ["application/pdf"]
    return imageTypes.includes(doc.file_type) || pdfTypes.includes(doc.file_type)
  }

  const renderPreview = (doc: Document | InvoiceAttachment) => {
    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/svg+xml", "image/webp"]

    if (imageTypes.includes(doc.file_type)) {
      return (
        <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
          <img
            src={doc.file_url || "/placeholder.svg"}
            alt={"original_filename" in doc ? doc.original_filename : doc.file_name}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      )
    }

    if (doc.file_type === "application/pdf") {
      return (
        <div className="w-full h-[70vh] bg-muted/30 rounded-lg overflow-hidden">
          <iframe
            src={doc.file_url}
            className="w-full h-full border-0"
            title={"original_filename" in doc ? doc.original_filename : doc.file_name}
          />
        </div>
      )
    }

    return (
      <div className="p-8 text-center text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Bu dosya türü için önizleme mevcut değil</p>
        <Button variant="outline" className="mt-4 bg-transparent" asChild>
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Dosyayı İndir
          </a>
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dokümanlar</h3>
        {!invoiceId && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Dosya Yükle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Dosya Yükle</DialogTitle>
              </DialogHeader>
              <DocumentUpload
                shipId={shipId}
                fixtureId={fixtureId}
                invoiceId={invoiceId}
                onUploadComplete={handleUploadComplete}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Henüz doküman yüklenmemiş</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.original_filename || doc.filename}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                        {"category" in doc && (
                          <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                            {categoryLabels[doc.category] || doc.category}
                          </span>
                        )}
                        <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                        {"uploaded_by_name" in doc && doc.uploaded_by_name && <span>• {doc.uploaded_by_name}</span>}
                        <span>• {new Date(doc.created_at).toLocaleDateString("tr-TR")}</span>
                      </div>
                      {"description" in doc && doc.description && (
                        <p className="text-sm text-muted-foreground mt-2">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {canPreview(doc) && (
                      <Button variant="outline" size="sm" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {previewDoc && ("original_filename" in previewDoc ? previewDoc.original_filename : previewDoc.file_name)}
            </DialogTitle>
          </DialogHeader>
          {previewDoc && renderPreview(previewDoc)}
        </DialogContent>
      </Dialog>
    </div>
  )
}
