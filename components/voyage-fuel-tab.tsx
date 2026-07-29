"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataLabel } from "@/components/data-label"
import { Fuel, Ship, Anchor } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface PortData {
  port_name: string
  arrival_rob_fo?: string
  arrival_rob_mgo?: string
  departure_rob_fo?: string
  departure_rob_mgo?: string
  fo_price?: string
  mgo_price?: string
}

interface VoyageData {
  loading_ports: PortData[]
  discharge_ports: PortData[]
}

interface VoyageFuelTabProps {
  voyageId: string
}

interface FuelConsumption {
  port: string
  type: "loading" | "discharge"
  arrivalFO: number
  arrivalMGO: number
  departureFO: number
  departureMGO: number
  portConsumptionFO: number
  portConsumptionMGO: number
  seaConsumptionFO: number
  seaConsumptionMGO: number
  foPrice: number
  mgoPrice: number
  portCostFO: number
  portCostMGO: number
  seaCostFO: number
  seaCostMGO: number
}

export function VoyageFuelTab({ voyageId }: VoyageFuelTabProps) {
  const [voyageData, setVoyageData] = useState<VoyageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVoyageData()
  }, [voyageId])

  const fetchVoyageData = async () => {
    try {
      const response = await fetch(`/api/voyages/${voyageId}`)
      if (response.ok) {
        const data = await response.json()
        setVoyageData(data)
      }
    } catch (error) {
      console.error("Error fetching voyage data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateFuelConsumption = (): FuelConsumption[] => {
    if (!voyageData) return []

    const allPorts: FuelConsumption[] = []
    let previousDepartureFO = 0
    let previousDepartureMGO = 0

    voyageData.loading_ports?.forEach((port, index) => {
      const arrivalFO = Number.parseFloat(port.arrival_rob_fo || "0")
      const arrivalMGO = Number.parseFloat(port.arrival_rob_mgo || "0")
      const departureFO = Number.parseFloat(port.departure_rob_fo || "0")
      const departureMGO = Number.parseFloat(port.departure_rob_mgo || "0")
      const foPrice = Number.parseFloat(port.fo_price || "0")
      const mgoPrice = Number.parseFloat(port.mgo_price || "0")

      // Port consumption = arrival - departure
      const portConsumptionFO = arrivalFO - departureFO
      const portConsumptionMGO = arrivalMGO - departureMGO

      // Sea consumption = previous port departure - current port arrival
      const seaConsumptionFO = index > 0 ? previousDepartureFO - arrivalFO : 0
      const seaConsumptionMGO = index > 0 ? previousDepartureMGO - arrivalMGO : 0

      allPorts.push({
        port: port.port_name || `Yükleme Limanı ${index + 1}`,
        type: "loading",
        arrivalFO,
        arrivalMGO,
        departureFO,
        departureMGO,
        portConsumptionFO,
        portConsumptionMGO,
        seaConsumptionFO,
        seaConsumptionMGO,
        foPrice,
        mgoPrice,
        portCostFO: portConsumptionFO * foPrice,
        portCostMGO: portConsumptionMGO * mgoPrice,
        seaCostFO: seaConsumptionFO * foPrice,
        seaCostMGO: seaConsumptionMGO * mgoPrice,
      })

      previousDepartureFO = departureFO
      previousDepartureMGO = departureMGO
    })

    voyageData.discharge_ports?.forEach((port, index) => {
      const arrivalFO = Number.parseFloat(port.arrival_rob_fo || "0")
      const arrivalMGO = Number.parseFloat(port.arrival_rob_mgo || "0")
      const departureFO = Number.parseFloat(port.departure_rob_fo || "0")
      const departureMGO = Number.parseFloat(port.departure_rob_mgo || "0")
      const foPrice = Number.parseFloat(port.fo_price || "0")
      const mgoPrice = Number.parseFloat(port.mgo_price || "0")

      const portConsumptionFO = arrivalFO - departureFO
      const portConsumptionMGO = arrivalMGO - departureMGO

      // Sea consumption from previous port (last loading port or previous discharge port)
      const seaConsumptionFO = previousDepartureFO - arrivalFO
      const seaConsumptionMGO = previousDepartureMGO - arrivalMGO

      allPorts.push({
        port: port.port_name || `Tahliye Limanı ${index + 1}`,
        type: "discharge",
        arrivalFO,
        arrivalMGO,
        departureFO,
        departureMGO,
        portConsumptionFO,
        portConsumptionMGO,
        seaConsumptionFO,
        seaConsumptionMGO,
        foPrice,
        mgoPrice,
        portCostFO: portConsumptionFO * foPrice,
        portCostMGO: portConsumptionMGO * mgoPrice,
        seaCostFO: seaConsumptionFO * foPrice,
        seaCostMGO: seaConsumptionMGO * mgoPrice,
      })

      previousDepartureFO = departureFO
      previousDepartureMGO = departureMGO
    })

    return allPorts
  }

  const calculateTotals = (consumptions: FuelConsumption[]) => {
    return consumptions.reduce(
      (acc, curr) => ({
        portConsumptionFO: acc.portConsumptionFO + curr.portConsumptionFO,
        portConsumptionMGO: acc.portConsumptionMGO + curr.portConsumptionMGO,
        seaConsumptionFO: acc.seaConsumptionFO + curr.seaConsumptionFO,
        seaConsumptionMGO: acc.seaConsumptionMGO + curr.seaConsumptionMGO,
        totalFO: acc.totalFO + curr.portConsumptionFO + curr.seaConsumptionFO,
        totalMGO: acc.totalMGO + curr.portConsumptionMGO + curr.seaConsumptionMGO,
        totalCost: acc.totalCost + curr.portCostFO + curr.portCostMGO + curr.seaCostFO + curr.seaCostMGO,
      }),
      {
        portConsumptionFO: 0,
        portConsumptionMGO: 0,
        seaConsumptionFO: 0,
        seaConsumptionMGO: 0,
        totalFO: 0,
        totalMGO: 0,
        totalCost: 0,
      },
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const fuelConsumptions = calculateFuelConsumption()
  const totals = calculateTotals(fuelConsumptions)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Yakıt Tüketimi ve Maliyetleri</h3>
        <p className="text-sm text-muted-foreground">
          Limanlardaki varış ve kalkış ROB değerlerine göre hesaplanmıştır
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Toplam Yakıt Tüketimi ve Maliyeti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Anchor className="h-4 w-4" />
                Limanda Tüketim
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DataLabel label="FO" value={`${totals.portConsumptionFO.toFixed(2)} MT`} />
                <DataLabel label="MGO" value={`${totals.portConsumptionMGO.toFixed(2)} MT`} />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Seyirde Tüketim
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DataLabel label="FO" value={`${totals.seaConsumptionFO.toFixed(2)} MT`} />
                <DataLabel label="MGO" value={`${totals.seaConsumptionMGO.toFixed(2)} MT`} />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DataLabel label="Toplam FO" value={`${totals.totalFO.toFixed(2)} MT`} />
              <DataLabel label="Toplam MGO" value={`${totals.totalMGO.toFixed(2)} MT`} />
              <DataLabel
                label="Toplam Maliyet"
                value={
                  totals.totalCost > 0
                    ? `$${totals.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "-"
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {fuelConsumptions.map((consumption, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {consumption.port}
              <Badge variant={consumption.type === "loading" ? "default" : "secondary"}>
                {consumption.type === "loading" ? "Yükleme" : "Tahliye"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Varış ROB</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">FO</span>
                    <Badge variant="secondary">{consumption.arrivalFO.toFixed(2)} MT</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">MGO</span>
                    <Badge variant="secondary">{consumption.arrivalMGO.toFixed(2)} MT</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Kalkış ROB</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">FO</span>
                    <Badge variant="secondary">{consumption.departureFO.toFixed(2)} MT</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">MGO</span>
                    <Badge variant="secondary">{consumption.departureMGO.toFixed(2)} MT</Badge>
                  </div>
                </div>
              </div>
            </div>

            {(consumption.portConsumptionFO > 0 || consumption.portConsumptionMGO > 0) && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Limanda Tüketim</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DataLabel label="FO" value={`${consumption.portConsumptionFO.toFixed(2)} MT`} />
                  <DataLabel label="MGO" value={`${consumption.portConsumptionMGO.toFixed(2)} MT`} />
                  {consumption.foPrice > 0 && (
                    <DataLabel label="FO Maliyeti" value={`$${consumption.portCostFO.toFixed(2)}`} />
                  )}
                  {consumption.mgoPrice > 0 && (
                    <DataLabel label="MGO Maliyeti" value={`$${consumption.portCostMGO.toFixed(2)}`} />
                  )}
                </div>
              </div>
            )}

            {index > 0 && (consumption.seaConsumptionFO > 0 || consumption.seaConsumptionMGO > 0) && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Seyirde Tüketim (Bu Limana Kadar)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DataLabel label="FO" value={`${consumption.seaConsumptionFO.toFixed(2)} MT`} />
                  <DataLabel label="MGO" value={`${consumption.seaConsumptionMGO.toFixed(2)} MT`} />
                  {consumption.foPrice > 0 && (
                    <DataLabel label="FO Maliyeti" value={`$${consumption.seaCostFO.toFixed(2)}`} />
                  )}
                  {consumption.mgoPrice > 0 && (
                    <DataLabel label="MGO Maliyeti" value={`$${consumption.seaCostMGO.toFixed(2)}`} />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {fuelConsumptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Fuel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Bu sefer için yakıt verisi bulunmuyor</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sefer düzenleme formundan liman bilgilerini ve ROB değerlerini girebilirsiniz
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
