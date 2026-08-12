"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InvoiceForm } from "@/components/invoice-form"
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  Download,
  Copy,
  Search,
  MoreHorizontal,
  Filter,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportInvoicesToExcel } from "@/lib/invoice-excel"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { InvoiceImportDialog } from "@/components/invoice-import-dialog"

type ColumnKey =
  | "invoiceNumber"
  | "invoiceType"
  | "shipName"
  | "charterer"
  | "type"
  | "status"
  | "commissionStatus"
  | "amount"
  | "commission"
  | "date"

interface ColumnConfig {
  key: ColumnKey
  label: string
  visible: boolean
  width: string
  align?: "left" | "right"
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterInvoiceType, setFilterInvoiceType] = useState<string>("all")
  const [filterCommissionStatus, setFilterCommissionStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())

  const [columnOrder, setColumnOrder] = useState<ColumnConfig[]>([
    { key: "invoiceNumber", label: "Fatura No", visible: true, width: "flex-1 min-w-[180px]" },
    { key: "invoiceType", label: "Fatura Türü", visible: true, width: "w-[130px]" },
    { key: "shipName", label: "Gemi Adı", visible: true, width: "w-[150px]" },
    { key: "charterer", label: "Kiracı", visible: true, width: "w-[150px]" },
    { key: "type", label: "Tip", visible: true, width: "w-[100px]" },
    { key: "status", label: "Durum", visible: true, width: "w-[130px]" },
    { key: "commissionStatus", label: "Komisyon Durumu", visible: true, width: "w-[150px]" },
    { key: "amount", label: "Tutar", visible: true, width: "w-[150px]", align: "right" },
    { key: "commission", label: "Komisyon", visible: true, width: "w-[130px]", align: "right" },
    { key: "date", label: "Tarih", visible: true, width: "w-[130px]" },
  ])

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invoice-column-widths")
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  const [resizing, setResizing] = useState<{ key: ColumnKey; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    fetchCompanies()
    fetchInvoices()
  }, [selectedCompany, filterType, filterStatus, filterInvoiceType, filterCommissionStatus])

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

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCompany !== "all") params.append("companyId", selectedCompany)
      if (filterType !== "all") params.append("type", filterType)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterInvoiceType !== "all") params.append("invoiceType", filterInvoiceType)
      if (filterCommissionStatus !== "all") params.append("commissionStatus", filterCommissionStatus)

      const response = await fetch(`/api/invoices?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu faturayı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchInvoices()
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
    }
  }

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingInvoice(null)
    fetchInvoices()
  }

  const handleExport = () => {
    exportInvoicesToExcel(invoices)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map((inv) => inv.id)))
    } else {
      setSelectedInvoices(new Set())
    }
  }

  const handleSelectInvoice = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedInvoices(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return
    if (!confirm(`${selectedInvoices.size} faturayı silmek istediğinizden emin misiniz?`)) return

    try {
      await Promise.all(Array.from(selectedInvoices).map((id) => fetch(`/api/invoices/${id}`, { method: "DELETE" })))
      setSelectedInvoices(new Set())
      fetchInvoices()
    } catch (error) {
      console.error("Error deleting invoices:", error)
    }
  }

  const handleBulkExport = () => {
    const selected = invoices.filter((inv) => selectedInvoices.has(inv.id))
    exportInvoicesToExcel(selected)
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedInvoices.size === 0) return
    if (!confirm(`${selectedInvoices.size} faturanın durumunu güncellemek istediğinizden emin misiniz?`)) return

    try {
      await Promise.all(
        Array.from(selectedInvoices).map((id) =>
          fetch(`/api/invoices/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }),
        ),
      )
      setSelectedInvoices(new Set())
      fetchInvoices()
    } catch (error) {
      console.error("Error updating invoices:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Beklemede", className: "bg-amber-100 text-amber-800 border-amber-200" },
      paid: { label: "Ödendi", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      overdue: { label: "Vadesi Geçti", className: "bg-rose-100 text-rose-800 border-rose-200" },
      cancelled: { label: "İptal", className: "bg-slate-100 text-slate-600 border-slate-200" },
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

  const getCommissionStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Beklemede", className: "bg-blue-100 text-blue-800 border-blue-200" },
      received: { label: "Tahsil Edildi", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      overdue: { label: "Gecikmiş", className: "bg-rose-100 text-rose-800 border-rose-200" },
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

  const getInvoiceTypeText = (type: string) => {
    const config = {
      freight: "Navlun",
      awrp: "AWRP",
      demurrage: "Demuraj",
      other: "Diğer",
    }
    return config[type as keyof typeof config] || type
  }

  const getTypeText = (type: string) => {
    return type === "income" ? "Gelir" : "Gider"
  }

  const handleCopy = async (invoice: any) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const copiedInvoice = await response.json()
        setInvoices([copiedInvoice, ...invoices])
        setEditingInvoice(copiedInvoice)
        setDialogOpen(true)
      }
    } catch (error) {
      console.error("[v0] Copy invoice error:", error)
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (filterInvoiceType !== "all" && invoice.invoice_type !== filterInvoiceType) return false
    if (filterCommissionStatus !== "all" && invoice.broker_commission_status !== filterCommissionStatus) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      invoice.invoice_number?.toLowerCase().includes(query) ||
      invoice.company_name?.toLowerCase().includes(query) ||
      invoice.ship_name?.toLowerCase().includes(query) ||
      invoice.charterer?.toLowerCase().includes(query) ||
      invoice.description?.toLowerCase().includes(query)
    )
  })

  const totalIncome = filteredInvoices.filter((i) => i.type === "income").reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpense = filteredInvoices
    .filter((i) => i.type === "expense")
    .reduce((sum, i) => sum + Number(i.amount), 0)

  const toggleColumnVisibility = (key: ColumnKey) => {
    setColumnOrder(columnOrder.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col)))
  }

  const moveColumn = (index: number, direction: "up" | "down") => {
    const newOrder = [...columnOrder]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    setColumnOrder(newOrder)
  }

  const renderCell = (column: ColumnConfig, invoice: any) => {
    switch (column.key) {
      case "invoiceNumber":
        return (
          <div className="w-full min-w-0">
            <Link
              href={`/dashboard/invoices/${invoice.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
            >
              {invoice.invoice_number}
            </Link>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{invoice.company_name}</p>
          </div>
        )
      case "invoiceType":
        return (
          <div className="w-full flex items-center text-sm truncate">
            {invoice.invoice_type ? getInvoiceTypeText(invoice.invoice_type) : "-"}
          </div>
        )
      case "shipName":
        return <div className="w-full flex items-center text-sm truncate">{invoice.ship_name || "-"}</div>
      case "charterer":
        return <div className="w-full flex items-center text-sm truncate">{invoice.charterer || "-"}</div>
      case "type":
        return (
          <div className="w-full flex items-center">
            <Badge variant={invoice.type === "income" ? "default" : "secondary"} className="font-normal">
              {getTypeText(invoice.type)}
            </Badge>
          </div>
        )
      case "status":
        return <div className="w-full flex items-center">{getStatusBadge(invoice.status)}</div>
      case "commissionStatus":
        return (
          <div className="w-full flex items-center">
            {invoice.broker_commission_status ? getCommissionStatusBadge(invoice.broker_commission_status) : "-"}
          </div>
        )
      case "amount":
        return (
          <div
            className={`w-full flex items-center ${column.align === "right" ? "justify-end" : ""} font-semibold whitespace-nowrap`}
          >
            {Number(invoice.amount).toLocaleString()} {invoice.currency}
          </div>
        )
      case "commission":
        return (
          <div
            className={`w-full flex items-center ${column.align === "right" ? "justify-end" : ""} text-sm text-muted-foreground whitespace-nowrap`}
          >
            {invoice.broker_commission ? `$${Number(invoice.broker_commission).toLocaleString()}` : "-"}
          </div>
        )
      case "date":
        return (
          <div className="w-full flex items-center text-sm whitespace-nowrap">
            {new Date(invoice.invoice_date).toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("invoice-column-widths", JSON.stringify(columnWidths))
    }
  }, [columnWidths])

  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return
      const diff = e.clientX - resizing.startX
      const newWidth = Math.max(100, resizing.startWidth + diff)
      setColumnWidths((prev) => ({ ...prev, [resizing.key]: newWidth }))
    }

    const handleMouseUp = () => {
      setResizing(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizing])

  const handleResizeStart = (key: ColumnKey, e: React.MouseEvent) => {
    e.preventDefault()
    const th = e.currentTarget.parentElement as HTMLElement
    setResizing({
      key,
      startX: e.clientX,
      startWidth: th.offsetWidth,
    })
  }

  // Kolonun varsayılan genişliğini Tailwind sınıfından (ör. "w-[130px]" veya
  // "flex-1 min-w-[180px]") çözüp somut bir flex ölçüsüne çevirir.
  const getDefaultColumnStyle = (column: ColumnConfig): React.CSSProperties => {
    if (column.width.includes("flex-1")) {
      const m = column.width.match(/min-w-\[(\d+)px\]/)
      const min = m ? Number(m[1]) : 160
      return { flex: `1 1 ${min}px`, minWidth: min }
    }
    const m = column.width.match(/w-\[(\d+)px\]/)
    const w = m ? Number(m[1]) : 130
    return { width: w, flexShrink: 0 }
  }

  // Başlık ve satırlar aynı ölçüyü kullanır; böylece kolonlar daima hizalı
  // kalır. Kullanıcı bir kolonu elle boyutlandırdıysa o piksel değeri geçerli.
  const getColumnStyle = (column: ColumnConfig): React.CSSProperties => {
    if (columnWidths[column.key]) {
      return { width: `${columnWidths[column.key]}px`, flexShrink: 0 }
    }
    return getDefaultColumnStyle(column)
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

  const visibleColumns = columnOrder.filter((col) => col.visible)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Faturalar</h1>
          <p className="text-sm text-muted-foreground">
            {filteredInvoices.length} fatura • {selectedInvoices.size > 0 && `${selectedInvoices.size} seçili`}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedCompany !== "all" && <InvoiceImportDialog companyId={selectedCompany} onSuccess={fetchInvoices} />}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={invoices.length === 0}
            className="gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Dışa Aktar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingInvoice(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Fatura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInvoice ? "Fatura Düzenle" : "Yeni Fatura"}</DialogTitle>
              </DialogHeader>
              {selectedCompany !== "all" || editingInvoice ? (
                <InvoiceForm
                  companyId={editingInvoice?.company_id || selectedCompany}
                  invoice={editingInvoice}
                  onSuccess={handleSuccess}
                  onCancel={() => setDialogOpen(false)}
                />
              ) : (
                <p className="text-muted-foreground">Lütfen önce bir şirket seçin</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredInvoices.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Toplam Gelir</p>
            <p className="text-3xl font-semibold tracking-tight text-emerald-600">${totalIncome.toLocaleString()}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-rose-500">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Toplam Gider</p>
            <p className="text-3xl font-semibold tracking-tight text-rose-600">${totalExpense.toLocaleString()}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-blue-500">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Net Bakiye</p>
            <p
              className={`text-3xl font-semibold tracking-tight ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              ${(totalIncome - totalExpense).toLocaleString()}
            </p>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Fatura no, şirket, gemi, kiracı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              <DropdownMenuLabel>Sütun Yönetimi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {columnOrder.map((column, index) => (
                  <div key={column.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-sm">
                    <Checkbox
                      checked={column.visible}
                      onCheckedChange={() => toggleColumnVisibility(column.key)}
                      id={column.key}
                    />
                    <label htmlFor={column.key} className="flex-1 text-sm cursor-pointer">
                      {column.label}
                    </label>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveColumn(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveColumn(index, "down")}
                        disabled={index === columnOrder.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[180px] h-10">
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

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px] h-10">
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="income">Gelir</SelectItem>
              <SelectItem value="expense">Gider</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterInvoiceType} onValueChange={setFilterInvoiceType}>
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder="Fatura Türü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Türler</SelectItem>
              <SelectItem value="freight">Navlun</SelectItem>
              <SelectItem value="awrp">AWRP</SelectItem>
              <SelectItem value="demurrage">Demuraj</SelectItem>
              <SelectItem value="other">Diğer</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="overdue">Vadesi Geçti</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCommissionStatus} onValueChange={setFilterCommissionStatus}>
            <SelectTrigger className="w-[190px] h-10">
              <SelectValue placeholder="Komisyon Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Komisyonlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="received">Tahsil Edildi</SelectItem>
              <SelectItem value="overdue">Gecikmiş</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedInvoices.size > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium">{selectedInvoices.size} fatura seçildi</p>
            <div className="flex gap-2">
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Durum Değiştir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="paid">Ödendi</SelectItem>
                  <SelectItem value="overdue">Vadesi Geçti</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleBulkExport} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
              <Button variant="outline" onClick={handleBulkDelete} size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          </div>
        </Card>
      )}

      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            searchQuery || selectedCompany !== "all" || filterType !== "all" || filterStatus !== "all"
              ? "Sonuç bulunamadı"
              : "Henüz fatura bulunmuyor"
          }
          description={
            searchQuery || selectedCompany !== "all" || filterType !== "all" || filterStatus !== "all"
              ? "Farklı filtreler veya arama terimleri deneyin"
              : "İlk faturanızı ekleyerek başlayın"
          }
          action={
            !searchQuery && selectedCompany === "all" && filterType === "all" && filterStatus === "all"
              ? {
                  label: "İlk Faturayı Ekle",
                  onClick: () => setDialogOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <div className="border-b bg-muted/40">
            <div className="flex gap-4 px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-10 flex items-center">
                <Checkbox
                  checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </div>
              {visibleColumns.map((column) => (
                <div
                  key={column.key}
                  className={`relative flex items-center ${column.align === "right" ? "justify-end" : ""}`}
                  style={getColumnStyle(column)}
                >
                  {column.label}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary"
                    onMouseDown={(e) => handleResizeStart(column.key, e)}
                  />
                </div>
              ))}
              <div className="w-[80px]"></div>
            </div>
          </div>

          <div className="divide-y">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="flex gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                <div className="w-10 flex items-center">
                  <Checkbox
                    checked={selectedInvoices.has(invoice.id)}
                    onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                  />
                </div>

                {visibleColumns.map((column) => (
                  <div key={column.key} className="overflow-hidden" style={getColumnStyle(column)}>
                    {renderCell(column, invoice)}
                  </div>
                ))}

                <div className="w-[80px] flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopy(invoice)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopyala
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(invoice.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
