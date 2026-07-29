"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

interface CertificateFilePreviewProps {
  fileUrl: string
  fileName?: string
  fileSize?: number
}

export function CertificateFilePreview({ fileUrl, fileName, fileSize }: CertificateFilePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const getFileExtension = (url: string) => {
    return url.split(".").pop()?.toLowerCase() || ""
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const extension = getFileExtension(fileUrl)
  const isPDF = extension === "pdf"
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)

  return (
    <>
      <div className="flex gap-1">
        {(isPDF || isImage) && (
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Sertifika Önizleme</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[70vh] overflow-auto">
            {isPDF ? (
              <iframe src={fileUrl} className="w-full h-full border-0" title="PDF Preview" />
            ) : isImage ? (
              <img src={fileUrl || "/placeholder.svg"} alt="Certificate" className="w-full h-auto" />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Bu dosya türü için önizleme desteklenmiyor</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
