"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CurrencyConverterProps {
  usdAmount: number
  label: string
}

const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  AED: 3.67,
  TRY: 34.5,
}

export function VoyageCalculatorCurrency({ usdAmount, label }: CurrencyConverterProps) {
  const [currency, setCurrency] = useState<keyof typeof EXCHANGE_RATES>("USD")
  const [convertedAmount, setConvertedAmount] = useState(usdAmount)

  useEffect(() => {
    setConvertedAmount(usdAmount * EXCHANGE_RATES[currency])
  }, [usdAmount, currency])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Label className="text-sm text-muted-foreground mb-1">{label}</Label>
          <div className="text-2xl font-bold">
            {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="w-24">
          <Select value={currency} onValueChange={(v) => setCurrency(v as keyof typeof EXCHANGE_RATES)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="TRY">TRY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {currency !== "USD" && (
        <div className="mt-2 text-xs text-muted-foreground">
          1 USD = {EXCHANGE_RATES[currency]} {currency}
        </div>
      )}
    </Card>
  )
}
