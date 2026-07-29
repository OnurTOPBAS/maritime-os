"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { TrendingUp, TrendingDown, DollarSign, Fuel } from "lucide-react"

interface ScenarioAnalysisProps {
  baseFoPrice: number
  baseMgoPrice: number
  baseRevenue: number
  totalFO: number
  totalMGO: number
  runningCost: number
  otherCosts: number
  onScenarioChange: (scenario: {
    fuelCost: number
    totalCost: number
    totalRevenue: number
    netProfit: number
  }) => void
}

export function VoyageCalculatorScenario({
  baseFoPrice,
  baseMgoPrice,
  baseRevenue,
  totalFO,
  totalMGO,
  runningCost,
  otherCosts,
  onScenarioChange,
}: ScenarioAnalysisProps) {
  const [foChange, setFoChange] = useState(0)
  const [mgoChange, setMgoChange] = useState(0)
  const [revenueChange, setRevenueChange] = useState(0)

  const calculateScenario = (foPercent: number, mgoPercent: number, revPercent: number) => {
    const newFoPrice = baseFoPrice * (1 + foPercent / 100)
    const newMgoPrice = baseMgoPrice * (1 + mgoPercent / 100)
    const newRevenue = baseRevenue * (1 + revPercent / 100)

    const fuelCost = totalFO * newFoPrice + totalMGO * newMgoPrice
    const totalCost = fuelCost + runningCost + otherCosts
    const netProfit = newRevenue - totalCost

    return { fuelCost, totalCost, totalRevenue: newRevenue, netProfit }
  }

  const scenario = calculateScenario(foChange, mgoChange, revenueChange)
  const baseFuelCost = totalFO * baseFoPrice + totalMGO * baseMgoPrice
  const baseTotalCost = baseFuelCost + runningCost + otherCosts
  const baseNetProfit = baseRevenue - baseTotalCost

  const fuelCostDiff = scenario.fuelCost - baseFuelCost
  const netProfitDiff = scenario.netProfit - baseNetProfit

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Senaryo Analizi (What-If)
      </h3>
      <p className="text-sm text-muted-foreground mb-6">Yakıt fiyatları ve gelir değişimlerinin etkisini görün</p>

      <div className="space-y-6">
        {/* FO Price Change */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              FO Fiyat Değişimi
            </Label>
            <span className="text-sm font-medium">
              {foChange > 0 ? "+" : ""}
              {foChange}%
            </span>
          </div>
          <Slider
            value={[foChange]}
            onValueChange={(value) => setFoChange(value[0])}
            min={-50}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${baseFoPrice}/MT</span>
            <span>${(baseFoPrice * (1 + foChange / 100)).toFixed(0)}/MT</span>
          </div>
        </div>

        {/* MGO Price Change */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              MGO Fiyat Değişimi
            </Label>
            <span className="text-sm font-medium">
              {mgoChange > 0 ? "+" : ""}
              {mgoChange}%
            </span>
          </div>
          <Slider
            value={[mgoChange]}
            onValueChange={(value) => setMgoChange(value[0])}
            min={-50}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${baseMgoPrice}/MT</span>
            <span>${(baseMgoPrice * (1 + mgoChange / 100)).toFixed(0)}/MT</span>
          </div>
        </div>

        {/* Revenue Change */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Gelir Değişimi
            </Label>
            <span className="text-sm font-medium">
              {revenueChange > 0 ? "+" : ""}
              {revenueChange}%
            </span>
          </div>
          <Slider
            value={[revenueChange]}
            onValueChange={(value) => setRevenueChange(value[0])}
            min={-50}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${baseRevenue.toLocaleString()}</span>
            <span>${scenario.totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Results */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Yakıt Maliyeti:</span>
            <div className="text-right">
              <div className="font-medium">${scenario.fuelCost.toLocaleString()}</div>
              <div
                className={`text-xs ${fuelCostDiff > 0 ? "text-red-600" : fuelCostDiff < 0 ? "text-green-600" : ""}`}
              >
                {fuelCostDiff > 0 ? "+" : ""}${fuelCostDiff.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Toplam Maliyet:</span>
            <div className="font-medium">${scenario.totalCost.toLocaleString()}</div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Toplam Gelir:</span>
            <div className="font-medium">${scenario.totalRevenue.toLocaleString()}</div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Net Kar/Zarar:</span>
            <div className="text-right">
              <div className={`text-lg font-bold ${scenario.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${scenario.netProfit.toLocaleString()}
              </div>
              <div
                className={`text-xs flex items-center gap-1 justify-end ${netProfitDiff > 0 ? "text-green-600" : netProfitDiff < 0 ? "text-red-600" : ""}`}
              >
                {netProfitDiff > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : netProfitDiff < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {netProfitDiff > 0 ? "+" : ""}${netProfitDiff.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
