"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, TrendingUp, DollarSign, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface ForecastData {
  month: string
  expectedRevenue: number
  expectedExpense: number
  cashFlow: number
}

export function FinancialForecastWidget() {
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchForecast() {
      try {
        const invoicesRes = await fetch("/api/invoices")
        const voyagesRes = await fetch("/api/voyages")

        if (invoicesRes.ok && voyagesRes.ok) {
          const invoices = await invoicesRes.json()
          const voyages = await voyagesRes.json()

          const avgMonthlyRevenue =
            invoices
              .filter((i: any) => i.type === "income")
              .reduce((sum: number, i: any) => sum + Number(i.amount), 0) / 12

          const avgMonthlyExpense =
            invoices
              .filter((i: any) => i.type === "expense")
              .reduce((sum: number, i: any) => sum + Number(i.amount), 0) / 12

          const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran"]
          const forecastData = months.map((month, index) => ({
            month,
            expectedRevenue: avgMonthlyRevenue * (1 + Math.random() * 0.2),
            expectedExpense: avgMonthlyExpense * (1 + Math.random() * 0.15),
            cashFlow: 0,
          }))

          forecastData.forEach((data) => {
            data.cashFlow = data.expectedRevenue - data.expectedExpense
          })

          setForecast(forecastData)
        }
      } catch (error) {
        console.error("Error fetching forecast:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [])

  if (loading) {
    return (
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader>
          <CardTitle className="text-lg">Finansal Tahmin</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalExpectedRevenue = forecast.reduce((sum, f) => sum + f.expectedRevenue, 0)
  const totalExpectedExpense = forecast.reduce((sum, f) => sum + f.expectedExpense, 0)
  const totalCashFlow = totalExpectedRevenue - totalExpectedExpense

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Finansal Tahmin</CardTitle>
            <CardDescription>6 aylık gelir ve gider tahmini</CardDescription>
          </div>
          <LineChart className="h-8 w-8 text-indigo-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-400">Gelir</span>
            </div>
            <p className="text-sm font-bold text-green-700 dark:text-green-400">
              ${(totalExpectedRevenue / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <AlertCircle className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-700 dark:text-red-400">Gider</span>
            </div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              ${(totalExpectedExpense / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-700 dark:text-blue-400">Nakit</span>
            </div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">${(totalCashFlow / 1000).toFixed(0)}K</p>
          </div>
        </div>

        <div className="space-y-2">
          {forecast.slice(0, 3).map((data, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm font-medium">{data.month}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600">+${(data.expectedRevenue / 1000).toFixed(0)}K</span>
                <span className="text-red-600">-${(data.expectedExpense / 1000).toFixed(0)}K</span>
                <span className={`font-semibold ${data.cashFlow >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  ${(data.cashFlow / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
