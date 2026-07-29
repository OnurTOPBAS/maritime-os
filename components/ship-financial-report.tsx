"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ship, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

export function ShipFinancialReport() {
  const [reports, setReports] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [fleets, setFleets] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [selectedFleet, setSelectedFleet] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies()
    fetchFleets()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [selectedCompany, selectedFleet])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const fetchFleets = async () => {
    try {
      const response = await fetch("/api/fleets")
      if (response.ok) {
        const data = await response.json()
        setFleets(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching fleets:", error)
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCompany !== "all") params.append("companyId", selectedCompany)
      if (selectedFleet !== "all") params.append("fleetId", selectedFleet)

      const response = await fetch(`/api/reports/ship-financials?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReports(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totals = reports.reduce(
    (acc, report) => ({
      income: acc.income + Number(report.total_income),
      expense: acc.expense + Number(report.total_expense),
      profit: acc.profit + Number(report.net_profit),
    }),
    { income: 0, expense: 0, profit: 0 },
  )

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Tüm Şirketler" />
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
        <Select value={selectedFleet} onValueChange={setSelectedFleet}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Tüm Filolar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Filolar</SelectItem>
            {fleets.map((fleet) => (
              <SelectItem key={fleet.id} value={fleet.id}>
                {fleet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.expense)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatCurrency(totals.profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ship className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz rapor verisi bulunmuyor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.ship_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.ship_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      IMO: {report.imo_number} | Tip: {report.vessel_type}
                    </p>
                    {report.company_name && (
                      <p className="text-sm text-muted-foreground">Şirket: {report.company_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Net Kar</p>
                    <p
                      className={`text-xl font-bold ${Number(report.net_profit) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(Number(report.net_profit))}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fixture Sayısı</p>
                    <p className="font-medium text-lg">{report.fixture_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fatura Sayısı</p>
                    <p className="font-medium text-lg">{report.invoice_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Toplam Gelir</p>
                    <p className="font-medium text-green-600">{formatCurrency(Number(report.total_income))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Toplam Gider</p>
                    <p className="font-medium text-red-600">{formatCurrency(Number(report.total_expense))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
