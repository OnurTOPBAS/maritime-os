"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, Calendar, FileText, Check, X } from "lucide-react"
import { format, addMonths, subMonths, parse } from "date-fns"
import { tr } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface MonthlyReport {
  id: string
  report_month: string
  status: string
  notes?: string
  total_income_usd?: number
  total_expense_usd?: number
  created_at: string
}

interface OfficePnlMonthlySelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export function OfficePnlMonthlySelector({
  selectedMonth,
  onMonthChange,
}: OfficePnlMonthlySelectorProps) {
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newReportNotes, setNewReportNotes] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showReportsList, setShowReportsList] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/office-pnl/monthly-reports")
      const text = await response.text()
      if (response.ok) {
        try {
          const data = JSON.parse(text)
          setReports(Array.isArray(data) ? data : [])
        } catch {
          console.error("Failed to parse reports response")
          setReports([])
        }
      } else {
        console.error("Failed to fetch reports:", text)
        setReports([])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const currentDate = selectedMonth 
    ? parse(selectedMonth, "yyyy-MM", new Date())
    : new Date()

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1)
    onMonthChange(format(newDate, "yyyy-MM"))
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    onMonthChange(format(newDate, "yyyy-MM"))
  }

  const handleCreateReport = async () => {
    setIsCreating(true)
    try {
      const response = await fetch("/api/office-pnl/monthly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportMonth: selectedMonth,
          notes: newReportNotes || null,
        }),
      })

      if (response.ok) {
        toast.success("Aylık rapor oluşturuldu")
        setIsCreateDialogOpen(false)
        setNewReportNotes("")
        fetchReports()
      } else {
        const errorText = await response.text()
        let errorMessage = "Rapor oluşturulamadı"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error creating report:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setIsCreating(false)
    }
  }

  const currentReport = reports.find(r => r.report_month === selectedMonth)

  // Generate year options (last 5 years + next year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)

  // Months
  const months = [
    { value: "01", label: "Ocak" },
    { value: "02", label: "Şubat" },
    { value: "03", label: "Mart" },
    { value: "04", label: "Nisan" },
    { value: "05", label: "Mayıs" },
    { value: "06", label: "Haziran" },
    { value: "07", label: "Temmuz" },
    { value: "08", label: "Ağustos" },
    { value: "09", label: "Eylül" },
    { value: "10", label: "Ekim" },
    { value: "11", label: "Kasım" },
    { value: "12", label: "Aralık" },
  ]

  const selectedYear = selectedMonth ? selectedMonth.split("-")[0] : String(currentYear)
  const selectedMonthNum = selectedMonth ? selectedMonth.split("-")[1] : format(new Date(), "MM")

  const handleYearChange = (year: string) => {
    onMonthChange(`${year}-${selectedMonthNum}`)
  }

  const handleMonthNumChange = (month: string) => {
    onMonthChange(`${selectedYear}-${month}`)
  }

  const formatMonthLabel = (reportMonth: string) => {
    try {
      const date = parse(reportMonth, "yyyy-MM", new Date())
      return format(date, "MMMM yyyy", { locale: tr })
    } catch {
      return reportMonth
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aylık Rapor Seçimi
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowReportsList(!showReportsList)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Raporlar ({reports.length})
            </Button>
            {!currentReport && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Rapor Oluştur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {format(currentDate, "MMMM yyyy", { locale: tr })} Raporu Oluştur
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Notlar (Opsiyonel)</Label>
                      <Textarea
                        value={newReportNotes}
                        onChange={(e) => setNewReportNotes(e.target.value)}
                        placeholder="Bu ay için notlar..."
                      />
                    </div>
                    <Button 
                      onClick={handleCreateReport} 
                      disabled={isCreating}
                      className="w-full"
                    >
                      {isCreating ? "Oluşturuluyor..." : "Rapor Oluştur"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Select value={selectedMonthNum} onValueChange={handleMonthNumChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {currentReport && (
          <div className="p-3 bg-muted/50 rounded-md text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground">Durum: </span>
                <Badge variant={currentReport.status === "closed" ? "default" : "secondary"}>
                  {currentReport.status === "closed" ? "Kapatıldı" : "Açık"}
                </Badge>
              </div>
              {(currentReport.total_income_usd || currentReport.total_expense_usd) && (
                <div className="text-right text-xs">
                  <div className="text-green-600">
                    Gelir: ${Number(currentReport.total_income_usd || 0).toLocaleString()}
                  </div>
                  <div className="text-red-600">
                    Gider: ${Number(currentReport.total_expense_usd || 0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            {currentReport.notes && (
              <p className="text-muted-foreground mt-2 text-xs">
                {currentReport.notes}
              </p>
            )}
          </div>
        )}

        {/* Reports List */}
        <Collapsible open={showReportsList} onOpenChange={setShowReportsList}>
          <CollapsibleContent>
            <div className="border rounded-lg mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Gelir (USD)</TableHead>
                    <TableHead className="text-right">Gider (USD)</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        Yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        Henüz aylık rapor oluşturulmamış
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => {
                      const income = Number(report.total_income_usd || 0)
                      const expense = Number(report.total_expense_usd || 0)
                      const net = income - expense
                      return (
                        <TableRow 
                          key={report.id}
                          className={selectedMonth === report.report_month ? "bg-muted/50" : "cursor-pointer hover:bg-muted/30"}
                          onClick={() => onMonthChange(report.report_month)}
                        >
                          <TableCell className="font-medium">
                            {formatMonthLabel(report.report_month)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={report.status === "closed" ? "default" : "secondary"} className="text-xs">
                              {report.status === "closed" ? "Kapatıldı" : "Açık"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            ${income.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ${expense.toLocaleString()}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ${net.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {selectedMonth === report.report_month && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
