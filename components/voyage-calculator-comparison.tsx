"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Calculation {
  id: string
  name: string
  ship_name: string
  charterer: string
  total_days: number
  total_cost: number
  total_revenue: number
  net_profit: number
  fuel_cost: number
  running_cost: number
  other_costs: number
}

export function VoyageCalculatorComparison({ onClose }: { onClose: () => void }) {
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalculations()
  }, [])

  const fetchCalculations = async () => {
    try {
      const response = await fetch("/api/voyage-calculator")
      if (response.ok) {
        const data = await response.json()
        setCalculations(data)
      }
    } catch (error) {
      console.error("[v0] Fetch calculations error:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id))
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id])
      }
    }
  }

  const selectedCalculations = calculations.filter((calc) => selectedIds.includes(calc.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hesaplama Karşılaştırma</h1>
          <p className="text-muted-foreground mt-1">En fazla 4 hesaplama seçebilirsiniz</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Karşılaştırmak için hesaplama seçin ({selectedIds.length}/4)</h3>
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
              Seçimi Temizle
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {calculations.map((calc) => (
            <div key={calc.id} className="flex items-center space-x-2 p-3 hover:bg-muted rounded-lg">
              <Checkbox
                id={calc.id}
                checked={selectedIds.includes(calc.id)}
                onCheckedChange={() => toggleSelection(calc.id)}
                disabled={selectedIds.length >= 4 && !selectedIds.includes(calc.id)}
              />
              <label htmlFor={calc.id} className="flex-1 cursor-pointer">
                <div className="font-medium">{calc.name}</div>
                <div className="text-sm text-muted-foreground">
                  {calc.ship_name} - Net Kar: ${(calc.net_profit || 0).toLocaleString()}
                </div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {selectedIds.length >= 2 && (
        <Card className="p-6 overflow-x-auto">
          <h3 className="font-semibold mb-4">Karşılaştırma Tablosu</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Özellik</TableHead>
                {selectedCalculations.map((calc) => (
                  <TableHead key={calc.id} className="text-center">
                    {calc.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Gemi</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center">
                    {calc.ship_name}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Kiracı</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center">
                    {calc.charterer || "-"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Toplam Gün</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center">
                    {calc.total_days?.toFixed(1) || 0}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">Yakıt Maliyeti</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center">
                    ${(calc.fuel_cost || 0).toLocaleString()}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">Running Cost</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center">
                    ${(calc.running_cost || 0).toLocaleString()}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">Diğer Maliyetler</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center">
                    ${(calc.other_costs || 0).toLocaleString()}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>Toplam Maliyet</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center text-red-600">
                    ${(calc.total_cost || 0).toLocaleString()}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>Toplam Gelir</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell key={calc.id} className="text-center text-green-600">
                    ${(calc.total_revenue || 0).toLocaleString()}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="font-bold text-lg">
                <TableCell>Net Kar/Zarar</TableCell>
                {selectedCalculations.map((calc) => (
                  <TableCell
                    key={calc.id}
                    className={`text-center ${(calc.net_profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ${(calc.net_profit || 0).toLocaleString()}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
