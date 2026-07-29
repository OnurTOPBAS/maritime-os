"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { generateInvoiceTemplate, parseInvoiceExcel } from "@/lib/invoice-excel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface InvoiceImportDialogProps {
  companyId: string
  onSuccess: () => void
}

export function InvoiceImportDialog({ companyId, onSuccess }: InvoiceImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const handleDownloadTemplate = () => {
    const blob = generateInvoiceTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fatura_sablonu.xlsx"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    try {
      setImporting(true)
      setResult(null)

      const invoices = await parseInvoiceExcel(file)

      const response = await fetch("/api/invoices/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoices, companyId }),
      })

      if (!response.ok) {
        throw new Error("İçe aktarma başarısız")
      }

      const data = await response.json()
      setResult(data)

      if (data.success > 0) {
        onSuccess()
      }
    } catch (error: any) {
      setResult({
        success: 0,
        failed: 1,
        errors: [error.message || "Bilinmeyen hata"],
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setFile(null)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Upload className="h-4 w-4" />
          İçe Aktar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fatura İçe Aktarma</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">1. Şablonu İndirin</h3>
            <p className="text-sm text-muted-foreground">
              Önce Excel şablonunu indirin ve fatura bilgilerinizi doldurun.
            </p>
            <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Şablonu İndir
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">2. Doldurulmuş Dosyayı Yükleyin</h3>
            <p className="text-sm text-muted-foreground">Doldurduğunuz Excel dosyasını seçin ve içe aktarın.</p>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="invoice-file-input"
                />
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{file ? file.name : "Excel dosyası seçin..."}</span>
                </div>
              </label>
              <Button onClick={handleImport} disabled={!file || importing} className="gap-2">
                <Upload className="h-4 w-4" />
                {importing ? "İçe Aktarılıyor..." : "İçe Aktar"}
              </Button>
            </div>
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={50} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">Faturalar içe aktarılıyor...</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {result.success > 0 && (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    {result.success} fatura başarıyla içe aktarıldı.
                  </AlertDescription>
                </Alert>
              )}

              {result.failed > 0 && (
                <Alert className="border-rose-200 bg-rose-50">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800">
                    <p className="font-medium mb-2">{result.failed} fatura içe aktarılamadı:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-muted-foreground">... ve {result.errors.length - 5} hata daha</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button onClick={handleClose} variant="outline">
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
