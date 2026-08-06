"use client"

import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, Ship, DollarSign, Calculator } from "lucide-react"

interface DashboardProps {
  calculations: Array<{
    id: string
    name: string
    ship_name: string
    charterer: string
    total_cost: number
    total_revenue: number
    net_profit: number
    created_at: string
  }>
}

export function VoyageCalculatorDashboard({ calculations }: DashboardProps) {
  // Summary statistics
  const totalCalculations = calculations.length
  const profitableCount = calculations.filter((c) => (c.net_profit || 0) >= 0).length
  const unprofitableCount = totalCalculations - profitableCount
  const avgProfit = calculations.reduce((sum, c) => sum + (c.net_profit || 0), 0) / (totalCalculations || 1)
  const totalRevenue = calculations.reduce((sum, c) => sum + (c.total_revenue || 0), 0)
  const totalCost = calculations.reduce((sum, c) => sum + (c.total_cost || 0), 0)

  // Most profitable ships
  const shipProfits = calculations.reduce(
    (acc, calc) => {
      const ship = calc.ship_name
      if (!acc[ship]) {
        acc[ship] = { ship, totalProfit: 0, count: 0 }
      }
      acc[ship].totalProfit += calc.net_profit || 0
      acc[ship].count += 1
      return acc
    },
    {} as Record<string, { ship: string; totalProfit: number; count: number }>,
  )

  const topShips = Object.values(shipProfits)
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5)
    .map((s) => ({
      name: s.ship,
      profit: s.totalProfit,
      avgProfit: s.totalProfit / s.count,
      count: s.count,
    }))

  // Most profitable charterers
  const chartererProfits = calculations.reduce(
    (acc, calc) => {
      const charterer = calc.charterer || "Bilinmeyen"
      if (!acc[charterer]) {
        acc[charterer] = { charterer, totalProfit: 0, count: 0 }
      }
      acc[charterer].totalProfit += calc.net_profit || 0
      acc[charterer].count += 1
      return acc
    },
    {} as Record<string, { charterer: string; totalProfit: number; count: number }>,
  )

  const topCharterers = Object.values(chartererProfits)
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5)
    .map((c) => ({
      name: c.charterer,
      profit: c.totalProfit,
      avgProfit: c.totalProfit / c.count,
      count: c.count,
    }))

  // Trend analysis (last 30 days)
  const last30Days = calculations
    .filter((c) => {
      const date = new Date(c.created_at)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 30
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const trendData = last30Days.map((c) => ({
    date: new Date(c.created_at).toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
    profit: c.net_profit || 0,
    revenue: c.total_revenue || 0,
    cost: c.total_cost || 0,
  }))

  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Hesaplama</p>
              <p className="text-3xl font-bold">{totalCalculations}</p>
            </div>
            <Calculator className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ortalama Kar</p>
              <p className={`text-3xl font-bold ${avgProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${avgProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            {avgProfit >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Karlı / Zararlı</p>
              <p className="text-3xl font-bold">
                {profitableCount} / {unprofitableCount}
              </p>
            </div>
            <Ship className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Gelir</p>
              <p className="text-3xl font-bold text-green-600">
                ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Ships */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">En Karlı Gemiler</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topShips}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Bar dataKey="profit" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Charterers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">En Karlı Kiracılar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCharterers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Bar dataKey="profit" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Trend Analysis */}
      {trendData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Karlılık Trendi (Son 30 Gün)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#10b981" name="Kar" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Gelir" strokeWidth={2} />
              <Line type="monotone" dataKey="cost" stroke="#ef4444" name="Maliyet" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Profitability Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Karlılık Dağılımı</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: "Karlı", value: profitableCount },
                { name: "Zararlı", value: unprofitableCount },
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {[profitableCount, unprofitableCount].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
