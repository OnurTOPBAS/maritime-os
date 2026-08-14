"use client"

import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload } from "lucide-react"
import { toast } from "sonner"

const MONTHS_EN = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]

interface ParsedRow {
  feeCode: string
  company: string
  payee: string
  description: string
  invoiceDate: string
  invoiceNo: string
  priceTl: string | number
  priceUsd: string | number
  paymentStatus: string
  bank: string
  paymentMethod: string
  paymentDate: string
}

interface Props {
  reportMonth: string
  onImported: () => void
}

function cell(v: any): string {
  if (v == null) return ""
  if (v instanceof Date) {
    const dd = String(v.getDate()).padStart(2, "0")
    const mm = String(v.getMonth() + 1).padStart(2, "0")
    return `${dd}.${mm}.${v.getFullYear()}`
  }
  return String(v).trim()
}

export function OfficePnlImportDialog({ reportMonth, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [targetMonth, setTargetMonth] = useState(reportMonth)
  const [importing, setImporting] = useState(false)

  const pick = () => inputRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (inputRef.current) inputRef.current.value = "" // aynı dosya tekrar seçilebilsin
    if (!file) return

    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array", cellDates: true })

      // Ana sayfa: A1'inde "Office Expenses" geçen sayfa; yoksa ilk sayfa.
      let sheetName = wb.SheetNames[0]
      for (const name of wb.SheetNames) {
        const a1 = wb.Sheets[name]?.["A1"]?.v
        if (typeof a1 === "string" && /office expenses/i.test(a1)) { sheetName = name; break }
      }
      const ws = wb.Sheets[sheetName]
      const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: "" })

      // Başlığı YYYY-MM'e çevir (ör. "August 2026 - Office Expenses").
      let month = reportMonth
      const title = String(aoa[0]?.[0] ?? "")
      const tm = title.match(/([A-Za-zçğıöşüÇĞİÖŞÜ]+)\s+(\d{4})/)
      if (tm) {
        const idx = MONTHS_EN.indexOf(tm[1].toLowerCase())
        if (idx >= 0) month = `${tm[2]}-${String(idx + 1).padStart(2, "0")}`
      }

      // Veri satırları: 3. satırdan itibaren, "Toplam"/boş/"Actual Bank"e kadar.
      const parsed: ParsedRow[] = []
      for (let i = 2; i < aoa.length; i++) {
        const r = aoa[i] || []
        const first = cell(r[0]).toLowerCase()
        if (!cell(r[0]) && !cell(r[2])) continue
        if (first === "toplam" || first.startsWith("actual bank") || first === "total:") break
        parsed.push({
          feeCode: cell(r[0]),
          company: cell(r[1]),
          payee: cell(r[2]),
          description: cell(r[3]),
          invoiceDate: cell(r[4]),
          invoiceNo: cell(r[5]),
          priceTl: typeof r[6] === "number" ? r[6] : cell(r[6]),
          priceUsd: typeof r[7] === "number" ? r[7] : cell(r[7]),
          paymentStatus: cell(r[8]),
          bank: cell(r[9]),
          paymentMethod: cell(r[10]),
          paymentDate: cell(r[11]),
        })
      }

      if (parsed.length === 0) {
        toast.error("Dosyada uygun satır bulunamadı. Doğru şablon mu?")
        return
      }

      setRows(parsed)
      setTargetMonth(month)
      setOpen(true)
    } catch (err) {
      console.error(err)
      toast.error("Dosya okunamadı. Geçerli bir .xlsx mi?")
    }
  }

  const confirm = async () => {
    setImporting(true)
    try {
      const res = await fetch("/api/office-pnl/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportMonth: targetMonth, rows }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.inserted}/${data.total} satır içe aktarıldı`)
        if (data.errors?.length) console.warn("İçe aktarma uyarıları:", data.errors)
        setOpen(false)
        setRows([])
        onImported()
      } else {
        toast.error(data.error || "İçe aktarma başarısız")
      }
    } catch {
      toast.error("Bir hata oluştu")
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx" onChange={handleFile} className="hidden" />
      <Button variant="outline" onClick={pick} className="gap-2 bg-transparent">
        <Upload className="h-4 w-4" />
        Excel'den İçe Aktar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>İçe Aktarma Önizlemesi</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            <strong>{rows.length}</strong> satır bulundu. Hedef ay:{" "}
            <strong>{targetMonth}</strong>. Onaylarsan bu kayıtlar Office PnL'e eklenir.
          </p>

          <div className="overflow-auto border rounded-md flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead>Fee Code</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">TL</TableHead>
                  <TableHead className="text-right">USD</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Banka</TableHead>
                  <TableHead>Yöntem</TableHead>
                  <TableHead>Fatura Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap">{r.feeCode}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.payee}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{r.description}</TableCell>
                    <TableCell className="text-right">{String(r.priceTl)}</TableCell>
                    <TableCell className="text-right">{String(r.priceUsd)}</TableCell>
                    <TableCell>{r.paymentStatus}</TableCell>
                    <TableCell>{r.bank}</TableCell>
                    <TableCell>{r.paymentMethod}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.invoiceDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
              Vazgeç
            </Button>
            <Button onClick={confirm} disabled={importing}>
              {importing ? "Aktarılıyor..." : `İçe Aktar (${rows.length} satır)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
