"use client"

import { Card } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface VoyageCalculatorChartsProps {
  data: {
    fuelCost: number
    runningCost: number
    otherCosts: number
    totalRevenue: number
  }
}

const COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#10b981"]

export function VoyageCalculatorCharts({ data }: VoyageCalculatorChartsProps) {
  const costData = [
    { name: "Yakıt Maliyeti", value: data.fuelCost },
    { name: "Running Cost", value: data.runningCost },
    { name: "Diğer Maliyetler", value: data.otherCosts },
  ]

  const comparisonData = [
    {
      name: "Finansal Durum",
      Gelir: data.totalRevenue,
      Gider: data.fuelCost + data.runningCost + data.otherCosts,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-4">
        <h4 className="font-semibold mb-4 text-center">Maliyet Dağılımı</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={costData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {costData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-4 text-center">Gelir - Gider Karşılaştırması</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="Gelir" fill="#10b981" />
            <Bar dataKey="Gider" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
