"use client"

import { useState, useEffect } from "react"
import { ShipIcon, Plus, Trash2, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ShipType {
  id: string
  name: string
  fo_at_sea_laden?: number
  mgo_at_sea_laden?: number
  fo_at_sea_ballast?: number
  mgo_at_sea_ballast?: number
}

interface RouteLeg {
  id: string
  fromPort: string
  toPort: string
  distance: number
  condition: "laden" | "ballast"
  seaDays: number
  foConsumption: number
  mgoConsumption: number
}

export function VoyageCalculatorSimple() {
  // Step 1: Basic Info
  const [shipId, setShipId] = useState("")
  const [shipName, setShipName] = useState("")
  const [isFleetShip, setIsFleetShip] = useState(true)
  const [charterer, setCharterer] = useState("")
  const [serviceSpeed, setServiceSpeed] = useState("12")
  const [runningCost, setRunningCost] = useState("3000")

  // Fuel consumption rates (from ship or manual)
  const [foLaden, setFoLaden] = useState("25")
  const [mgoLaden, setMgoLaden] = useState("0.5")
  const [foBallast, setFoBallast] = useState("20")
  const [mgoBallast, setMgoBallast] = useState("0.5")

  // Step 2: Route Legs
  const [legs, setLegs] = useState<RouteLeg[]>([])
  const [newLeg, setNewLeg] = useState({
    fromPort: "",
    toPort: "",
    distance: "",
    condition: "laden" as "laden" | "ballast",
  })

  // Step 3: Costs & Revenues
  const [foPrice, setFoPrice] = useState("600")
  const [mgoPrice, setMgoPrice] = useState("800")
  const [otherCosts, setOtherCosts] = useState("0")
  const [freight, setFreight] = useState("0")

  // Fleet ships
  const [ships, setShips] = useState<ShipType[]>([])

  useEffect(() => {
    fetchShips()
  }, [])

  const fetchShips = async () => {
    try {
      const response = await fetch("/api/ships")
      if (response.ok) {
        const data = await response.json()
        setShips(data)
      }
    } catch (error) {
      console.error("Error fetching ships:", error)
    }
  }

  const handleShipSelect = (selectedShipId: string) => {
    setShipId(selectedShipId)
    const ship = ships.find((s) => s.id === selectedShipId)
    if (ship) {
      setShipName(ship.name)
      setIsFleetShip(true)
      // Auto-fill fuel consumption from ship card
      if (ship.fo_at_sea_laden) setFoLaden(ship.fo_at_sea_laden.toString())
      if (ship.mgo_at_sea_laden) setMgoLaden(ship.mgo_at_sea_laden.toString())
      if (ship.fo_at_sea_ballast) setFoBallast(ship.fo_at_sea_ballast.toString())
      if (ship.mgo_at_sea_ballast) setMgoBallast(ship.mgo_at_sea_ballast.toString())
    }
  }

  const calculateSeaDays = (distance: number, speed: number) => {
    return distance / (speed * 24)
  }

  const addLeg = () => {
    if (!newLeg.fromPort || !newLeg.toPort || !newLeg.distance) return

    const distance = Number.parseFloat(newLeg.distance)
    const speed = Number.parseFloat(serviceSpeed)
    const seaDays = calculateSeaDays(distance, speed)

    const foRate = newLeg.condition === "laden" ? Number.parseFloat(foLaden) : Number.parseFloat(foBallast)
    const mgoRate = newLeg.condition === "laden" ? Number.parseFloat(mgoLaden) : Number.parseFloat(mgoBallast)

    const leg: RouteLeg = {
      id: Date.now().toString(),
      fromPort: newLeg.fromPort,
      toPort: newLeg.toPort,
      distance,
      condition: newLeg.condition,
      seaDays,
      foConsumption: seaDays * foRate,
      mgoConsumption: seaDays * mgoRate,
    }

    setLegs([...legs, leg])
    setNewLeg({ fromPort: "", toPort: "", distance: "", condition: "laden" })
  }

  const removeLeg = (id: string) => {
    setLegs(legs.filter((l) => l.id !== id))
  }

  // Calculations
  const totalSeaDays = legs.reduce((sum, leg) => sum + leg.seaDays, 0)
  const totalFoConsumption = legs.reduce((sum, leg) => sum + leg.foConsumption, 0)
  const totalMgoConsumption = legs.reduce((sum, leg) => sum + leg.mgoConsumption, 0)

  const fuelCost = totalFoConsumption * Number.parseFloat(foPrice) + totalMgoConsumption * Number.parseFloat(mgoPrice)
  const runningCostTotal = totalSeaDays * Number.parseFloat(runningCost)
  const totalCost = fuelCost + runningCostTotal + Number.parseFloat(otherCosts)
  const totalRevenue = Number.parseFloat(freight)
  const netProfit = totalRevenue - totalCost

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sefer Hesaplama</h1>
          <p className="text-muted-foreground">Sefer öncesi maliyet ve gelir analizi</p>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShipIcon className="h-5 w-5" />
            1. Temel Bilgiler
          </CardTitle>
          <CardDescription>Gemi, kiracı ve operasyonel bilgiler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gemi Seçimi</Label>
              <Select value={shipId} onValueChange={handleShipSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Filo gemisi seç" />
                </SelectTrigger>
                <SelectContent>
                  {ships.map((ship) => (
                    <SelectItem key={ship.id} value={ship.id}>
                      {ship.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>veya Manuel Gemi Adı</Label>
              <Input
                value={shipName}
                onChange={(e) => {
                  setShipName(e.target.value)
                  setIsFleetShip(false)
                  setShipId("")
                }}
                placeholder="Gemi adı girin"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Potansiyel Kiracı</Label>
              <Input value={charterer} onChange={(e) => setCharterer(e.target.value)} placeholder="Kiracı adı" />
            </div>

            <div className="space-y-2">
              <Label>Servis Hızı (knot)</Label>
              <Input
                type="number"
                value={serviceSpeed}
                onChange={(e) => setServiceSpeed(e.target.value)}
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label>Running Cost ($/gün)</Label>
              <Input
                type="number"
                value={runningCost}
                onChange={(e) => setRunningCost(e.target.value)}
                placeholder="3000"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Yakıt Tüketim Oranları (MT/gün)</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">FO Yüklü Seyir</Label>
                <Input type="number" value={foLaden} onChange={(e) => setFoLaden(e.target.value)} placeholder="25" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">MGO Yüklü Seyir</Label>
                <Input type="number" value={mgoLaden} onChange={(e) => setMgoLaden(e.target.value)} placeholder="0.5" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">FO Boş Seyir</Label>
                <Input
                  type="number"
                  value={foBallast}
                  onChange={(e) => setFoBallast(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">MGO Boş Seyir</Label>
                <Input
                  type="number"
                  value={mgoBallast}
                  onChange={(e) => setMgoBallast(e.target.value)}
                  placeholder="0.5"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Route Legs */}
      <Card>
        <CardHeader>
          <CardTitle>2. Rota Bacakları</CardTitle>
          <CardDescription>Liman ve mesafe bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Çıkış Limanı</Label>
              <Input
                value={newLeg.fromPort}
                onChange={(e) => setNewLeg({ ...newLeg, fromPort: e.target.value })}
                placeholder="İstanbul"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Varış Limanı</Label>
              <Input
                value={newLeg.toPort}
                onChange={(e) => setNewLeg({ ...newLeg, toPort: e.target.value })}
                placeholder="Rotterdam"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Mesafe (NM)</Label>
              <Input
                type="number"
                value={newLeg.distance}
                onChange={(e) => setNewLeg({ ...newLeg, distance: e.target.value })}
                placeholder="1500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Kondisyon</Label>
              <Select
                value={newLeg.condition}
                onValueChange={(value: "laden" | "ballast") => setNewLeg({ ...newLeg, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laden">Yüklü</SelectItem>
                  <SelectItem value="ballast">Boş</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addLeg} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ekle
              </Button>
            </div>
          </div>

          {legs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Çıkış</TableHead>
                  <TableHead>Varış</TableHead>
                  <TableHead className="text-right">Mesafe (NM)</TableHead>
                  <TableHead>Kondisyon</TableHead>
                  <TableHead className="text-right">Deniz Günü</TableHead>
                  <TableHead className="text-right">FO (MT)</TableHead>
                  <TableHead className="text-right">MGO (MT)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legs.map((leg) => (
                  <TableRow key={leg.id}>
                    <TableCell className="font-medium">{leg.fromPort}</TableCell>
                    <TableCell>{leg.toPort}</TableCell>
                    <TableCell className="text-right">{leg.distance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={leg.condition === "laden" ? "default" : "secondary"}>
                        {leg.condition === "laden" ? "Yüklü" : "Boş"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{leg.seaDays.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{leg.foConsumption.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{leg.mgoConsumption.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeLeg(leg.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Costs & Revenues */}
      <Card>
        <CardHeader>
          <CardTitle>3. Maliyetler ve Gelirler</CardTitle>
          <CardDescription>Yakıt fiyatları ve finansal bilgiler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>FO Fiyatı ($/MT)</Label>
              <Input type="number" value={foPrice} onChange={(e) => setFoPrice(e.target.value)} placeholder="600" />
            </div>
            <div className="space-y-2">
              <Label>MGO Fiyatı ($/MT)</Label>
              <Input type="number" value={mgoPrice} onChange={(e) => setMgoPrice(e.target.value)} placeholder="800" />
            </div>
            <div className="space-y-2">
              <Label>Diğer Maliyetler ($)</Label>
              <Input type="number" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Navlun Geliri ($)</Label>
              <Input type="number" value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Hesaplama Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Toplam Deniz Günü</p>
              <p className="text-2xl font-bold">{totalSeaDays.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Yakıt Maliyeti</p>
              <p className="text-2xl font-bold">${fuelCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Running Cost</p>
              <p className="text-2xl font-bold">
                ${runningCostTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
              <p className="text-2xl font-bold text-destructive">
                ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Toplam Gider</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Kar/Zarar</p>
                <p className={`text-3xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
