"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TrendingUp } from "lucide-react"

interface InflationCalculatorProps {
  baseCost: number
  voyageDays: number
}

export function VoyageCalculatorInflation({ baseCost, voyageDays }: InflationCalculatorProps) {
  const [inflationRate, setInflationRate] = useState(5)
  const [contractMonths, setContractMonths] = useState(12)

  const monthlyRate = inflationRate / 12 / 100
  const voyageMonths = voyageDays / 30
  const averageInflationFactor = 1 + monthlyRate * (contractMonths / 2)
  const adjustedCost = baseCost * averageInflationFactor
  const totalInflationCost = adjustedCost - baseCost

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Enflasyon / Eskalasyon
      </h3>
      <p className="text-sm text-muted-foreground mb-6">Uzun süreli seferler için maliyet artışı hesaplama</p>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inflation">Yıllık Enflasyon Oranı (%)</Label>
            <Input
              id="inflation"
              type="number"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number.parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="months">Kontrat Süresi (ay)</Label>
            <Input
              id="months"
              type="number"
              value={contractMonths}
              onChange={(e) => setContractMonths(Number.parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Baz Maliyet:</span>
            <span className="font-medium">${baseCost.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ortalama Enflasyon Faktörü:</span>
            <span className="font-medium">{averageInflationFactor.toFixed(4)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Düzeltilmiş Maliyet:</span>
            <span className="font-medium">${adjustedCost.toLocaleString()}</span>
          </div>

          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Toplam Enflasyon Maliyeti:</span>
            <span className="text-lg font-bold text-orange-600">+${totalInflationCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
          <p>
            Not: Bu hesaplama, kontrat süresince ortalama enflasyon etkisini gösterir. Uzun süreli kontratlarda
            maliyetlerin zamanla artacağını dikkate alır.
          </p>
        </div>
      </div>
    </Card>
  )
}
