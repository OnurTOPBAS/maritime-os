"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Cloud, Wind } from "lucide-react"

interface WeatherFactorProps {
  baseSpeed: number
  baseFuelConsumption: number
  totalDays: number
  onWeatherAdjustment: (adjustment: { speedReduction: number; fuelIncrease: number }) => void
}

const WEATHER_FACTORS = {
  summer: { label: "Yaz (İyi Hava)", speedReduction: 0, fuelIncrease: 0 },
  spring_fall: { label: "İlkbahar/Sonbahar (Orta)", speedReduction: 5, fuelIncrease: 3 },
  winter: { label: "Kış (Kötü Hava)", speedReduction: 10, fuelIncrease: 8 },
  storm: { label: "Fırtına Sezonu", speedReduction: 15, fuelIncrease: 12 },
}

export function VoyageCalculatorWeather({
  baseSpeed,
  baseFuelConsumption,
  totalDays,
  onWeatherAdjustment,
}: WeatherFactorProps) {
  const [season, setSeason] = useState<keyof typeof WEATHER_FACTORS>("summer")

  const factor = WEATHER_FACTORS[season]
  const adjustedSpeed = baseSpeed * (1 - factor.speedReduction / 100)
  const adjustedFuel = baseFuelConsumption * (1 + factor.fuelIncrease / 100)
  const additionalDays = (totalDays * factor.speedReduction) / 100

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Cloud className="h-5 w-5" />
        Hava Durumu Faktörü
      </h3>
      <p className="text-sm text-muted-foreground mb-6">Mevsimsel hız düşüşü ve yakıt tüketimi artışı</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Mevsim / Hava Koşulu</Label>
          <Select value={season} onValueChange={(v) => setSeason(v as keyof typeof WEATHER_FACTORS)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WEATHER_FACTORS).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="h-4 w-4" />
              <span>Hız Etkisi</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Baz Hız:</span>
                <span className="font-medium">{baseSpeed.toFixed(1)} knot</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Düzeltilmiş Hız:</span>
                <span className="font-medium text-orange-600">{adjustedSpeed.toFixed(1)} knot</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Hız Kaybı:</span>
                <span>{factor.speedReduction}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cloud className="h-4 w-4" />
              <span>Yakıt Etkisi</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Baz Tüketim:</span>
                <span className="font-medium">{baseFuelConsumption.toFixed(1)} MT/gün</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Düzeltilmiş:</span>
                <span className="font-medium text-orange-600">{adjustedFuel.toFixed(1)} MT/gün</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Artış:</span>
                <span>+{factor.fuelIncrease}%</span>
              </div>
            </div>
          </div>
        </div>

        {factor.speedReduction > 0 && (
          <div className="pt-4 border-t bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ek Sefer Süresi:</span>
                <span className="font-medium text-orange-600">+{additionalDays.toFixed(1)} gün</span>
              </div>
              <div className="text-xs text-muted-foreground">Hava koşulları nedeniyle sefer süresi uzayabilir</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
