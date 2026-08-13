"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { OfficePnlForm } from "@/components/office-pnl-form"
import { exportOfficePnlToExcel } from "@/lib/office-pnl-export"
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Search,
  MoreHorizontal,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Copy,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OfficePnlListProps {
  reportMonth?: string
}

export function OfficePnlList({ reportMonth }: OfficePnlListProps) {
  const [records, setRecords] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [feeCodes, setFeeCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [filterFeeCode, setFilterFeeCode] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCompanies()
    fetchFeeCodes()
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [selectedCompany, filterFeeCode, filterStatus, filterType, reportMonth])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
      setCompanies([])
    }
  }

  const fetchFeeCodes = async () => {
    try {
      const response = await fetch("/api/office-pnl/fee-codes")
      if (response.ok) {
        const data = await response.json()
        setFeeCodes(data)
      }
    } catch (error) {
      console.error("Error fetching fee codes:", error)
    }
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (reportMonth) params.append("reportMonth", reportMonth)
      if (selectedCompany !== "all") params.append("companyId", selectedCompany)
      if (filterFeeCode !== "all") params.append("feeCodeId", filterFeeCode)
      if (filterStatus !== "all") params.append("paymentStatus", filterStatus)
      if (filterType !== "all") params.append("type", filterType)

      const response = await fetch(`/api/office-pnl?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching records:", error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/office-pnl/record/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchRecords()
      }
    } catch (error) {
      console.error("Error deleting record:", error)
    }
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  const handleCopy = (record: any) => {
    // Create a copy without the ID and reset some fields
    const copiedRecord = {
      ...record,
      id: undefined, // Remove ID so it creates a new record
      invoice_no: "", // Clear invoice number
      payment_status: "unpaid", // Reset to unpaid
      payment_date: null, // Clear payment date
    }
    setEditingRecord(copiedRecord)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingRecord(null)
    fetchRecords()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(filteredRecords.map((r) => r.id)))
    } else {
      setSelectedRecords(new Set())
    }
  }

  const handleSelectRecord = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRecords(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return
    if (!confirm(`${selectedRecords.size} kaydı silmek istediğinizden emin misiniz?`)) return

    try {
      await Promise.all(Array.from(selectedRecords).map((id) => fetch(`/api/office-pnl/record/${id}`, { method: "DELETE" })))
      setSelectedRecords(new Set())
      fetchRecords()
    } catch (error) {
      console.error("Error deleting records:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      paid: { label: "Ödendi", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      unpaid: { label: "Ödenmedi", className: "bg-amber-100 text-amber-800 border-amber-200" },
      cancel: { label: "İptal", className: "bg-slate-100 text-slate-600 border-slate-200" },
    }
    const { label, className } = config[status as keyof typeof config] || {
      label: status,
      className: "bg-slate-100 text-slate-600 border-slate-200",
    }
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    if (type === "income") {
      return (
        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
          <TrendingUp className="h-3 w-3 mr-1" />
          Gelir
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200">
        <TrendingDown className="h-3 w-3 mr-1" />
        Gider
      </Badge>
    )
  }

  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      record.payee?.toLowerCase().includes(query) ||
      record.description?.toLowerCase().includes(query) ||
      record.invoice_no?.toLowerCase().includes(query) ||
      record.company_name?.toLowerCase().includes(query) ||
      record.fee_code_name?.toLowerCase().includes(query)
    )
  })

  // Toplamlar (USD bazında)
  const totalIncome = filteredRecords
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + (Number(r.price_usd) || 0), 0)
  
  const totalExpense = filteredRecords
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + (Number(r.price_usd) || 0), 0)

  const netBalance = totalIncome - totalExpense

  const handleExportTemplate = async () => {
    try {
      const month = reportMonth || new Date().toISOString().slice(0, 7)
      // O ayın banka bakiyelerini çek (şablonun banka tablosu için).
      let balances: any[] = []
      try {
        const res = await fetch(`/api/office-pnl/bank-balances?reportMonth=${month}`)
        if (res.ok) balances = await res.json()
      } catch {
        // bakiye alınamazsa tablo boş kalır, gider listesi yine iner
      }
      await exportOfficePnlToExcel(filteredRecords, Array.isArray(balances) ? balances : [], month)
    } catch (e) {
      console.error("Şablon export hatası:", e)
    }
  }

  const handleExport = () => {
    // Basit CSV export
    const headers = ["Tarih", "Payee", "Fee Code", "Açıklama", "TL", "USD", "Durum", "Tip"]
    const rows = filteredRecords.map((r) => [
      r.invoice_date ? new Date(r.invoice_date).toLocaleDateString("tr-TR") : "",
      r.payee || "",
      r.fee_code_name || r.fee_code_custom || "",
      r.description || "",
      r.price_tl || "",
      r.price_usd || "",
      r.payment_status || "",
      r.type === "income" ? "Gelir" : "Gider",
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `office-pnl-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Office PnL</h1>
          <p className="text-sm text-muted-foreground">
            {filteredRecords.length} kayıt {selectedRecords.size > 0 && `• ${selectedRecords.size} seçili`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={records.length === 0} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={handleExportTemplate} disabled={filteredRecords.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Excel (Şablon)
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRecord(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Kayıt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRecord ? "Kaydı Düzenle" : "Yeni Kayıt"}</DialogTitle>
              </DialogHeader>
              <OfficePnlForm
                record={editingRecord}
                reportMonth={reportMonth}
                onSuccess={handleSuccess}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {filteredRecords.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Toplam Gelir (USD)</p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-emerald-600">${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-rose-500">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-rose-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Toplam Gider (USD)</p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-rose-600">${totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Bakiye (USD)</p>
            </div>
            <p className={`text-3xl font-semibold tracking-tight ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ${netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Payee, açıklama, fatura no ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Şirket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Şirketler</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterFeeCode} onValueChange={setFilterFeeCode}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Fee Code" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Fee Codes</SelectItem>
              {feeCodes.map((code) => (
                <SelectItem key={code.id} value={code.id}>
                  {code.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="income">Gelir</SelectItem>
              <SelectItem value="expense">Gider</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="unpaid">Ödenmedi</SelectItem>
              <SelectItem value="cancel">İptal</SelectItem>
            </SelectContent>
          </Select>

          {selectedRecords.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              {selectedRecords.size} Sil
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="Kayıt bulunamadı"
          description="Henüz kayıt yok veya filtrelere uygun kayıt bulunamadı."
          action={
            <Button onClick={() => { setEditingRecord(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kayıt Ekle
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Fatura Tarihi</TableHead>
                <TableHead>Fee Code</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Şirket</TableHead>
                <TableHead className="text-right">TL</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Banka</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecords.has(record.id)}
                      onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    {record.invoice_date
                      ? new Date(record.invoice_date).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{record.fee_code_name || record.fee_code_custom || "-"}</span>
                  </TableCell>
                  <TableCell className="font-medium">{record.payee}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.description || "-"}</TableCell>
                  <TableCell>{record.company_name || record.company_name_ref || "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {record.price_tl ? `₺${Number(record.price_tl).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {record.price_usd ? `$${Number(record.price_usd).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
                  </TableCell>
                  <TableCell>{getTypeBadge(record.type)}</TableCell>
                  <TableCell>{getStatusBadge(record.payment_status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.payee_bank_name || record.payee_bank_custom || "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(record)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopy(record)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Kopyala
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(record.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
