"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react"

interface Summary {
  kasaUsd: number
  kasaTl: number
  incomeUsd: number
  expenseUsd: number
  netUsd: number
}

interface Props {
  reportMonth: string
  /** Kayıt/bakiye değişince yeniden çekmek için artırılan sayaç. */
  refreshKey?: number
}

const usd = (v: number) =>
  `$${(Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const tl = (v: number) =>
  `${(Number(v) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`

export function OfficePnlSummary({ reportMonth, refreshKey = 0 }: Props) {
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    fetch(`/api/office-pnl/summary?reportMonth=${reportMonth}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
  }, [reportMonth, refreshKey])

  const net = data?.netUsd ?? 0

  const cards = [
    {
      label: "Toplam Kasa",
      sub: "tüm bankalar, ödenenlere göre",
      value: usd(data?.kasaUsd ?? 0),
      extra: tl(data?.kasaTl ?? 0),
      icon: Wallet,
      accent: "text-primary",
    },
    {
      label: "Bu Ay Gelir",
      sub: "tüm şirketler",
      value: usd(data?.incomeUsd ?? 0),
      icon: TrendingUp,
      accent: "text-green-600",
    },
    {
      label: "Bu Ay Gider",
      sub: "tüm şirketler",
      value: usd(data?.expenseUsd ?? 0),
      icon: TrendingDown,
      accent: "text-red-600",
    },
    {
      label: "Bu Ay Net",
      sub: "gelir − gider",
      value: usd(net),
      icon: Scale,
      accent: net >= 0 ? "text-green-600" : "text-red-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.accent}`} />
            </div>
            <div className={`mt-1 text-xl font-semibold ${c.accent}`}>{c.value}</div>
            {c.extra && <div className="text-xs text-muted-foreground">{c.extra}</div>}
            <div className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
