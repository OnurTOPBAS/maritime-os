"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CertificateFilePreview } from "./certificate-file-preview"

interface CertificateVersionHistoryProps {
  certificateId: string
  shipId: string
}

export function CertificateVersionHistory({ certificateId, shipId }: CertificateVersionHistoryProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchVersions()
    }
  }, [open, certificateId])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ships/${shipId}/certificates/${certificateId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
      } else {
        throw new Error("Failed to fetch versions")
      }
    } catch (error) {
      console.error("[v0] Error fetching versions:", error)
      toast({
        title: "Hata",
        description: "Versiyon geçmişi yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Versiyon Geçmişi</span>
          <span className="sm:hidden">Versiyon</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Sertifika Versiyon Geçmişi</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Henüz versiyon geçmişi bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`border rounded-lg p-3 md:p-4 ${version.is_current ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm md:text-base">Versiyon {version.version}</h4>
                    {version.is_current && (
                      <Badge variant="default" className="text-xs">
                        Güncel
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded w-full sm:w-auto">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm truncate">{version.file_name || "Sertifika Dosyası"}</p>
                        {version.file_size && (
                          <p className="text-xs text-muted-foreground">{formatFileSize(version.file_size)}</p>
                        )}
                      </div>
                      {version.file_type && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {version.file_type.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <CertificateFilePreview
                      fileUrl={version.file_url}
                      fileName={version.file_name}
                      fileSize={version.file_size}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
                  <p>Yükleyen: {version.uploaded_by_name || "Bilinmiyor"}</p>
                  <p>Tarih: {formatDate(version.created_at)}</p>
                  {version.notes && (
                    <div className="mt-2 p-2 bg-muted rounded">
                      <p className="text-xs font-medium">Notlar:</p>
                      <p className="text-xs break-words">{version.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
