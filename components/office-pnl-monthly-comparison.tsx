"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { format, subMonths, parse } from "date-fns"
import { tr } from "date-fns/locale"

interface MonthlyData {
  month: string
  totalIncome: number
  totalExpense: number
  netBalance: number
}

interface OfficePnlMonthlyComparisonProps {
  currentMonth: string
}

export function OfficePnlMonthlyComparison({ currentMonth }: OfficePnlMonthlyComparisonProps) {
  const [monthsToCompare, setMonthsToCompare] = useState<string>("3")
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMonthlyData()
  }, [currentMonth, monthsToCompare])

  const fetchMonthlyData = async () => {
    setIsLoading(true)
    try {
      const currentDate = parse(currentMonth, "yyyy-MM", new Date())
      const months: string[] = []
      
      for (let i = 0; i < parseInt(monthsToCompare); i++) {
        const monthDate = subMonths(currentDate, i)
        months.push(format(monthDate, "yyyy-MM"))
      }

      const dataPromises = months.map(async (month) => {
        const response = await fetch(`/api/office-pnl?reportMonth=${month}`)
        if (response.ok) {
          const records = await response.json()
          
          const totalIncome = records
            .filter((r: any) => r.type === "income")
            .reduce((sum: number, r: any) => sum + (Number(r.price_usd) || 0), 0)
          
          const totalExpense = records
            .filter((r: any) => r.type === "expense")
            .reduce((sum: number, r: any) => sum + (Number(r.price_usd) || 0), 0)

          return {
            month,
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
          }
        }
        return { month, totalIncome: 0, totalExpense: 0, netBalance: 0 }
      })

      const results = await Promise.all(dataPromises)
      setMonthlyData(results.reverse())
    } catch (error) {
      console.error("Error fetching monthly data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMonth = (month: string) => {
    try {
      const date = parse(month, "yyyy-MM", new Date())
      return format(date, "MMM yyyy", { locale: tr })
    } catch {
      return month
    }
  }

  const getChangeIndicator = (current: number, previous: number | undefined) => {
    if (previous === undefined) return null
    const change = ((current - previous) / Math.abs(previous || 1)) * 100
    
    if (Math.abs(change) < 1) {
      return <Minus className="h-4 w-4 text-muted-foreground" />
    }
    if (change > 0) {
      return (
        <span className="flex items-center text-green-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{change.toFixed(1)}%
        </span>
      )
    }
    return (
      <span className="flex items-center text-red-600 text-xs">
        <TrendingDown className="h-3 w-3 mr-1" />
        {change.toFixed(1)}%
      </span>
    )
  }

  // Find max values for bar heights
  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.totalIncome, d.totalExpense, 1))
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Aylık Karşılaştırma
          </CardTitle>
          <Select value={monthsToCompare} onValueChange={setMonthsToCompare}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Son 3 Ay</SelectItem>
              <SelectItem value="6">Son 6 Ay</SelectItem>
              <SelectItem value="12">Son 12 Ay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
        ) : monthlyData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Veri bulunamadı</div>
        ) : (
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-40">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex gap-1 items-end h-32 w-full justify-center">
                    {/* Income Bar */}
                    <div
                      className="w-1/3 bg-green-500 rounded-t transition-all"
                      style={{
                        height: `${(data.totalIncome / maxValue) * 100}%`,
                        minHeight: data.totalIncome > 0 ? "4px" : "0",
                      }}
                      title={`Gelir: $${data.totalIncome.toLocaleString()}`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-1/3 bg-red-500 rounded-t transition-all"
                      style={{
                        height: `${(data.totalExpense / maxValue) * 100}%`,
                        minHeight: data.totalExpense > 0 ? "4px" : "0",
                      }}
                      title={`Gider: $${data.totalExpense.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatMonth(data.month)}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Gelir</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Gider</span>
              </div>
            </div>

            {/* Summary Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Ay</th>
                    <th className="text-right p-2 font-medium">Gelir</th>
                    <th className="text-right p-2 font-medium">Gider</th>
                    <th className="text-right p-2 font-medium">Net</th>
                    <th className="text-right p-2 font-medium">Değişim</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, index) => (
                    <tr key={data.month} className="border-t">
                      <td className="p-2">{formatMonth(data.month)}</td>
                      <td className="p-2 text-right text-green-600">
                        ${data.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        ${data.totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-2 text-right font-medium ${
                        data.netBalance >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        ${data.netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right">
                        {getChangeIndicator(
                          data.netBalance,
                          monthlyData[index - 1]?.netBalance
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
