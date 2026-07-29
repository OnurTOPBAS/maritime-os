"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Upload, Download, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DataImporterProps {
  entityType: "ships" | "invoices"
  onImportComplete?: () => void
}

export function DataImporter({ entityType, onImportComplete }: DataImporterProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const templates = {
    ships: {
      filename: "ships_template.csv",
      headers: ["fleet_id", "name", "imo_number", "flag", "ship_type", "dwt", "built_year", "status"],
      example: "fleet-uuid,MV Example,1234567,Turkey,Bulk Carrier,75000,2015,active",
    },
    invoices: {
      filename: "invoices_template.csv",
      headers: ["company_id", "invoice_number", "invoice_date", "due_date", "amount", "type", "status", "description"],
      example: "company-uuid,INV-001,2024-01-15,2024-02-15,50000,income,pending,Charter payment",
    },
  }

  const handleDownloadTemplate = () => {
    const template = templates[entityType]
    const csv = `${template.headers.join(",")}\n${template.example}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = template.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }

    return data
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
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
      const text = await file.text()
      const data = parseCSV(text)

      const response = await fetch(`/api/import/${entityType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [entityType]: data }),
      })

      if (response.ok) {
        const result = await response.json()
        setResults(result)

        if (result.success > 0) {
          toast({
            title: "İçe Aktarma Tamamlandı",
            description: `${result.success} kayıt başarıyla içe aktarıldı`,
          })
          onImportComplete?.()
        }

        if (result.failed > 0) {
          toast({
            title: "Bazı Kayıtlar Başarısız",
            description: `${result.failed} kayıt içe aktarılamadı`,
            variant: "destructive",
          })
        }
      } else {
        throw new Error("Import failed")
      }
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Hata",
        description: "Veri içe aktarılamadı",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Veri İçe Aktar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{entityType === "ships" ? "Gemi" : "Fatura"} Verilerini İçe Aktar</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CSV formatında veri yükleyebilirsiniz. Önce şablonu indirip doldurun, sonra yükleyin.
            </AlertDescription>
          </Alert>

          <div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Şablon İndir
            </Button>
          </div>

          <div>
            <Label htmlFor="file-upload">CSV Dosyası Seç</Label>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {results && (
            <div className="space-y-2">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold text-green-600">Başarılı:</span> {results.success}
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-red-600">Başarısız:</span> {results.failed}
                </p>
              </div>

              {results.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  <p className="text-sm font-semibold">Hatalar:</p>
                  {results.errors.map((err: any, idx: number) => (
                    <div key={idx} className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded">
                      {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Kapat
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
