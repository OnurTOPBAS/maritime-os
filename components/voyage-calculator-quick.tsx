"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calculator } from "lucide-react"

interface QuickCalculatorProps {
  onClose: () => void
}

export function VoyageCalculatorQuick({ onClose }: QuickCalculatorProps) {
  const [distance, setDistance] = useState("")
  const [speed, setSpeed] = useState("")
  const [foPrice, setFoPrice] = useState("")
  const [foConsumption, setFoConsumption] = useState("")
  const [runningCost, setRunningCost] = useState("")
  const [freight, setFreight] = useState("")

  const distanceNum = Number.parseFloat(distance) || 0
  const speedNum = Number.parseFloat(speed) || 0
  const foPriceNum = Number.parseFloat(foPrice) || 0
  const foConsumptionNum = Number.parseFloat(foConsumption) || 0
  const runningCostNum = Number.parseFloat(runningCost) || 0
  const freightNum = Number.parseFloat(freight) || 0

  const seaDays = speedNum > 0 ? distanceNum / (speedNum * 24) : 0
  const fuelCost = seaDays * foConsumptionNum * foPriceNum
  const runningCostTotal = seaDays * runningCostNum
  const totalCost = fuelCost + runningCostTotal
  const netProfit = freightNum - totalCost

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hızlı Hesaplama</h1>
          <p className="text-muted-foreground mt-1">Basit ve hızlı sefer karlılık hesabı</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Temel Bilgiler</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Mesafe (NM)</Label>
              <Input
                id="distance"
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="2500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Hız (knot)</Label>
              <Input
                id="speed"
                type="number"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="14.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foConsumption">Yakıt Tüketimi (MT/gün)</Label>
              <Input
                id="foConsumption"
                type="number"
                step="0.1"
                value={foConsumption}
                onChange={(e) => setFoConsumption(e.target.value)}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foPrice">Yakıt Fiyatı ($/MT)</Label>
              <Input
                id="foPrice"
                type="number"
                value={foPrice}
                onChange={(e) => setFoPrice(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="runningCost">Running Cost ($/gün)</Label>
              <Input
                id="runningCost"
                type="number"
                value={runningCost}
                onChange={(e) => setRunningCost(e.target.value)}
                placeholder="7000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="freight">Navlun ($)</Label>
              <Input
                id="freight"
                type="number"
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                placeholder="150000"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Hesaplama Sonuçları
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Deniz Günü:</span>
                <span className="font-semibold">{seaDays.toFixed(2)} gün</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Yakıt Maliyeti:</span>
                <span className="font-semibold">
                  ${fuelCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Running Cost:</span>
                <span className="font-semibold">
                  ${runningCostTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Toplam Maliyet:</span>
                <span className="font-bold">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Navlun:</span>
                <span className="font-semibold">
                  ${freightNum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold text-lg">Net Kar/Zarar:</span>
                <span className={`font-bold text-2xl ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Günlük Kar:</p>
              <p className="text-xl font-bold">
                ${seaDays > 0 ? (netProfit / seaDays).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} /
                gün
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
