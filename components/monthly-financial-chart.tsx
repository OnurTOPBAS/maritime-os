"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface MonthlyData {
  month: string
  income: number
  expense: number
  net: number
}

interface Company {
  id: string
  name: string
}

interface Ship {
  id: string
  name: string
}

interface Fleet {
  id: string
  name: string
}

export function MonthlyFinancialChart() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [ships, setShips] = useState<Ship[]>([])
  const [fleets, setFleets] = useState<Fleet[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [selectedShip, setSelectedShip] = useState<string>("all")
  const [selectedFleet, setSelectedFleet] = useState<string>("all")
  const [months, setMonths] = useState<string>("12")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies()
    fetchShips()
    fetchFleets()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedCompany, selectedShip, selectedFleet, months])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  const fetchShips = async () => {
    try {
      const response = await fetch("/api/ships")
      if (response.ok) {
        const data = await response.json()
        setShips(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch ships:", error)
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
      console.error("Failed to fetch fleets:", error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ months })
      if (selectedCompany !== "all") {
        params.append("companyId", selectedCompany)
      }
      if (selectedShip !== "all") {
        params.append("shipId", selectedShip)
      }
      if (selectedFleet !== "all") {
        params.append("fleetId", selectedFleet)
      }

      const response = await fetch(`/api/analytics/monthly-financials?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.reverse())
      }
    } catch (error) {
      console.error("Failed to fetch monthly financials:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Aylık Gelir/Gider Analizi</CardTitle>
            <CardDescription>Son {months} ayın finansal performansı</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Şirket seçin" />
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filo seçin" />
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
            <Select value={selectedShip} onValueChange={setSelectedShip}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Gemi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Gemiler</SelectItem>
                {ships.map((ship) => (
                  <SelectItem key={ship.id} value={ship.id}>
                    {ship.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 Ay</SelectItem>
                <SelectItem value="12">12 Ay</SelectItem>
                <SelectItem value="24">24 Ay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Veri bulunamadı</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelStyle={{ color: "#000" }}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Gelir" />
              <Bar dataKey="expense" fill="#ef4444" name="Gider" />
              <Bar dataKey="net" fill="#3b82f6" name="Net Kar" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
