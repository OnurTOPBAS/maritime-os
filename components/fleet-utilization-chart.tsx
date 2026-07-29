"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Ship, Anchor } from "lucide-react"

interface FleetData {
  fleet_name: string
  company_name?: string
  total_ships: number
  active_ships: number
  inactive_ships: number
  total_fixtures: number
  total_voyages: number
  utilization_rate: number
}

interface Company {
  id: string
  name: string
}

export function FleetUtilizationChart() {
  const [data, setData] = useState<FleetData[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedCompany])

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

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCompany !== "all") {
        params.append("companyId", selectedCompany)
      }

      const response = await fetch(`/api/analytics/fleet-utilization?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch fleet utilization:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filo Kullanım Oranları</CardTitle>
            <CardDescription>Filolara göre gemi ve sefer istatistikleri</CardDescription>
          </div>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[200px]">
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
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Veri bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((fleet, index) => (
              <div key={index} className="space-y-3 pb-6 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{fleet.fleet_name}</h3>
                    {fleet.company_name && <p className="text-sm text-muted-foreground">{fleet.company_name}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{fleet.utilization_rate || 0}%</p>
                    <p className="text-xs text-muted-foreground">Kullanım Oranı</p>
                  </div>
                </div>

                <Progress value={fleet.utilization_rate || 0} className="h-2" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{fleet.total_ships}</p>
                      <p className="text-xs text-muted-foreground">Toplam Gemi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{fleet.active_ships}</p>
                      <p className="text-xs text-muted-foreground">Aktif</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">{fleet.total_fixtures}</p>
                      <p className="text-xs text-muted-foreground">Fixture</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">{fleet.total_voyages}</p>
                      <p className="text-xs text-muted-foreground">Sefer</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
