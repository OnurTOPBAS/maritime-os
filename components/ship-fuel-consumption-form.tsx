"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface FuelConsumption {
  fo: number
  mgo: number
}

interface ConsumptionOperations {
  loading: FuelConsumption
  discharge: FuelConsumption
  laden: FuelConsumption
  ballast: FuelConsumption
  anchor: FuelConsumption
  idle: FuelConsumption
  inerting: FuelConsumption
  washing: FuelConsumption
  heating: FuelConsumption
  incinerator: FuelConsumption
}

interface ShipFuelConsumptionFormProps {
  operations: ConsumptionOperations
  onChange: (data: { operations: ConsumptionOperations }) => void
}

const operationLabels: Record<keyof ConsumptionOperations, string> = {
  loading: "Yükleme",
  discharge: "Tahliye",
  laden: "Yüklü Seyir",
  ballast: "Boş Seyir",
  anchor: "Demirde",
  idle: "Boşta",
  inerting: "Inerting",
  washing: "Washing",
  heating: "Heating",
  incinerator: "Incinerator",
}

/**
 * Gelen operasyon verisini tam şekle getirir: her operasyon anahtarı ve
 * altında {fo, mgo} garanti edilir. Eski/eksik/null kayıtlar bu sayede
 * çökme yerine 0 ile gösterilir.
 */
function normalizeOperations(ops: any): ConsumptionOperations {
  const src = ops && typeof ops === "object" ? ops : {}
  const out: any = {}
  for (const key of Object.keys(operationLabels)) {
    const v = src[key] && typeof src[key] === "object" ? src[key] : {}
    out[key] = { fo: Number(v.fo) || 0, mgo: Number(v.mgo) || 0 }
  }
  return out as ConsumptionOperations
}

export function ShipFuelConsumptionForm({ operations, onChange }: ShipFuelConsumptionFormProps) {
  const [localOperations, setLocalOperations] = useState<ConsumptionOperations>(() =>
    normalizeOperations(operations),
  )

  const handleOperationChange = (operation: keyof ConsumptionOperations, fuel: "fo" | "mgo", value: string) => {
    const newOperations = {
      ...localOperations,
      [operation]: {
        ...localOperations[operation],
        [fuel]: Number.parseFloat(value) || 0,
      },
    }
    setLocalOperations(newOperations)
    onChange({ operations: newOperations })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Operasyonel Yakıt Tüketimi</CardTitle>
        <CardDescription className="text-xs">Her operasyon için günlük FO ve MGO tüketim değerleri</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px] h-9 text-xs">Operasyon</TableHead>
                <TableHead className="text-center h-9 text-xs">FO (MT/gün)</TableHead>
                <TableHead className="text-center h-9 text-xs">MGO (MT/gün)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(operationLabels) as Array<keyof ConsumptionOperations>).map((operation) => (
                <TableRow key={operation} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-sm py-2">{operationLabels[operation]}</TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localOperations[operation].fo}
                      onChange={(e) => handleOperationChange(operation, "fo", e.target.value)}
                      placeholder="0.0"
                      className="h-8 text-center text-sm"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={localOperations[operation].mgo}
                      onChange={(e) => handleOperationChange(operation, "mgo", e.target.value)}
                      placeholder="0.0"
                      className="h-8 text-center text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
