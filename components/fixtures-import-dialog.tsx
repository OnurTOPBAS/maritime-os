"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { generateFixturesTemplate, parseFixturesExcel } from "@/lib/fixtures-excel"
import { useToastNotification } from "@/components/toast-provider"

interface FixturesImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FixturesImportDialog({ open, onOpenChange, onSuccess }: FixturesImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const toast = useToastNotification()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)

    try {
      const fixtures = await parseFixturesExcel(file)
      setProgress(50)

      const response = await fetch("/api/fixtures/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtures }),
      })

      const data = await response.json()
      setProgress(100)
      setResult(data)

      if (data.success > 0) {
        toast.success("İçe aktarma tamamlandı", `${data.success} fixture başarıyla eklendi`)
        onSuccess()
      }

      if (data.failed > 0) {
        toast.error("Bazı fixture'lar eklenemedi", `${data.failed} fixture eklenirken hata oluştu`)
      }
    } catch (error: any) {
      toast.error("İçe aktarma başarısız", error.message)
      setResult({ success: 0, failed: 0, errors: [error.message] })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fixture'ları İçe Aktar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              Excel dosyasından toplu fixture ekleyebilirsiniz. Önce şablonu indirin, doldurun ve yükleyin.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={generateFixturesTemplate} variant="outline" className="flex-1 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Şablon İndir
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="fixtures-file-upload"
            />
            <label htmlFor="fixtures-file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {file ? file.name : "Excel dosyası seçin veya sürükleyin"}
              </p>
              <Button type="button" variant="outline" size="sm">
                Dosya Seç
              </Button>
            </label>
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">İçe aktarılıyor...</p>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              {result.success > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{result.success} fixture başarıyla eklendi</AlertDescription>
                </Alert>
              )}
              {result.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.failed} fixture eklenemedi
                    {result.errors.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-xs">
                        {result.errors.slice(0, 5).map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                        {result.errors.length > 5 && <li>... ve {result.errors.length - 5} hata daha</li>}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              <Upload className="h-4 w-4 mr-2" />
              İçe Aktar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
