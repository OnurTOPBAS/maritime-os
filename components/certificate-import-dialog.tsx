"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

interface CertificateImportDialogProps {
  shipId?: string
  onSuccess?: () => void
}

export function CertificateImportDialog({ shipId, onSuccess }: CertificateImportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleDownloadTemplate = () => {
    const template = [
      {
        "Gemi IMO": "9123456",
        "Sertifika Adı": "Safety Equipment Certificate (SEC)",
        "Sertifika Tipi": "SEC",
        "Sertifika Numarası": "SEC-2024-001",
        "Verilme Tarihi": "2024-01-15",
        "Son Yıllık Muayene": "2024-01-15",
        "Son Ara Muayene": "",
        "Son Kullanma Tarihi": "2029-01-15",
        "Veren Kurum": "Lloyd's Register",
        Durum: "valid",
        Notlar: "",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sertifikalar")

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sertifika-import-sablonu.xlsx"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Hata",
        description: "Lütfen bir dosya seçin",
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    setResults(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const certificates = jsonData.map((row: any) => ({
        ship_imo: row["Gemi IMO"],
        certificate_name: row["Sertifika Adı"],
        certificate_type: row["Sertifika Tipi"],
        certificate_number: row["Sertifika Numarası"] || null,
        issued_date: row["Verilme Tarihi"] || null,
        last_annual_date: row["Son Yıllık Muayene"] || null,
        last_intermediate_date: row["Son Ara Muayene"] || null,
        expires_date: row["Son Kullanma Tarihi"] || null,
        issuing_authority: row["Veren Kurum"] || null,
        status: row["Durum"] || "valid",
        notes: row["Notlar"] || null,
      }))

      console.log("[v0] Importing certificates:", { count: certificates.length, shipId })

      const response = await fetch("/api/certificates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificates, shipId }),
      })

      const result = await response.json()

      if (response.ok) {
        setResults(result)

        if (result.success > 0) {
          toast({
            title: "İçe aktarma tamamlandı",
            description: `${result.success} sertifika başarıyla eklendi${result.failed > 0 ? `, ${result.failed} başarısız` : ""}`,
          })
          onSuccess?.()
        } else {
          toast({
            title: "Uyarı",
            description: "Hiçbir sertifika eklenemedi",
            variant: "destructive",
          })
        }
      } else {
        throw new Error(result.error || result.details || "Import failed")
      }
    } catch (error) {
      console.error("[v0] Import error:", error)
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "İçe aktarma sırasında bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Excel'den İçe Aktar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sertifika İçe Aktarma</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Excel dosyanızı yüklemeden önce şablon dosyasını indirip formatı kontrol edin. Gemi IMO numarası sistemde
              kayıtlı olmalıdır.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} className="flex-1 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Şablon Dosyayı İndir
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Excel Dosyası Seçin</Label>
            <Input id="file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            {file && <p className="text-sm text-muted-foreground">Seçilen dosya: {file.name}</p>}
          </div>

          {results && (
            <Alert variant={results.failed > 0 ? "destructive" : "default"}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">İçe Aktarma Sonuçları:</p>
                  <p>Başarılı: {results.success}</p>
                  <p>Başarısız: {results.failed}</p>
                  {results.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold mb-1">Hatalar:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {results.errors.slice(0, 5).map((err: any, idx: number) => (
                          <li key={idx}>
                            {err.row?.certificate_name || "Bilinmeyen"}: {err.error}
                          </li>
                        ))}
                        {results.errors.length > 5 && <li>... ve {results.errors.length - 5} hata daha</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? "İçe Aktarılıyor..." : "İçe Aktar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
