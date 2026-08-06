"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2, TrendingDown } from "lucide-react" // Import TrendingDown
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge" // Import Badge component

import { VoyageCalculatorCharts } from "./voyage-calculator-charts"
import { VoyageCalculatorExport } from "./voyage-calculator-export"
import { VoyageCalculatorScenario } from "./voyage-calculator-scenario"
import { VoyageCalculatorCurrency } from "./voyage-calculator-currency"
import { VoyageCalculatorWeather } from "./voyage-calculator-weather"
import { VoyageCalculatorInflation } from "./voyage-calculator-inflation"
import { PortSearchInput } from "./port-search-input"

// Import necessary icons from lucide-react
import { Route, DollarSign, FileText, BarChart3, Settings } from "lucide-react"

// Removed duplicate Ship interface and imported Ship from Ship component
// interface Ship {
//   id: string
//   name: string
//   consumption_operations: any
// }

interface Leg {
  id?: string
  from_port: string
  to_port: string
  distance_nm: number
  condition: "laden" | "ballast"
  sea_days?: number
  fo_consumption?: number
  mgo_consumption?: number
  from_port_uuid?: string
  from_port_unlocode?: string
  to_port_uuid?: string
  to_port_unlocode?: string
}

// Existing interface for Cost (renamed to avoid conflict with costItems)
interface OldCost {
  id?: string
  description: string
  amount: number
}

// New interfaces for updated cost and revenue structures
interface CostItem {
  category: string
  description: string
  amount: number
}

interface RevenueItem {
  type: string
  description: string
  amount: number
}

interface Operations {
  loading_days: number
  discharge_days: number
  anchor_days: number
  idle_days: number
  inerting_days: number
  washing_days: number
  heating_days: number
  incinerator_days: number
  include_inerting_in_total?: boolean
  include_washing_in_total?: boolean
  include_heating_in_total?: boolean
  include_incinerator_in_total?: boolean
}

interface Revenue {
  description: string
  amount: number
}

export function VoyageCalculatorForm({
  calculationId,
  onClose,
}: {
  calculationId: string | null
  onClose: () => void
}) {
  // Assume Ship type is imported from elsewhere or defined globally for consumption_operations
  const [ships, setShips] = useState<any[]>([]) // Use 'any' or a specific imported type for Ship
  const [name, setName] = useState("")
  const [shipId, setShipId] = useState("")
  const [shipName, setShipName] = useState("")
  const [charterer, setCharterer] = useState("")
  const [serviceSpeed, setServiceSpeed] = useState("")
  const [runningCost, setRunningCost] = useState("")
  const [fuelConsumption, setFuelConsumption] = useState<any>({})
  const [foPrice, setFoPrice] = useState("")
  const [mgoPrice, setMgoPrice] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<string>("draft")
  const [tagInput, setTagInput] = useState("")

  const [legs, setLegs] = useState<Leg[]>([])
  // Changed from `costs` to `costs` to align with the new structure, but original interface is `OldCost`
  const [costs, setCosts] = useState<OldCost[]>([]) // This will be replaced by costItems logic
  const [revenues, setRevenues] = useState<Revenue[]>([]) // This will be replaced by revenueItems logic

  const [operations, setOperations] = useState<Operations>({
    loading_days: 0,
    discharge_days: 0,
    anchor_days: 0,
    idle_days: 0,
    inerting_days: 0,
    washing_days: 0,
    heating_days: 0,
    incinerator_days: 0,
    include_inerting_in_total: true,
    include_washing_in_total: true,
    include_heating_in_total: true,
    include_incinerator_in_total: true,
  })

  const [autoSaving, setAutoSaving] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

  const [costItems, setCostItems] = useState<CostItem[]>([
    { category: "PDA Yükleme Limanı", description: "", amount: 0 },
    { category: "PDA Tahliye Limanı", description: "", amount: 0 },
    { category: "PDA Transit", description: "", amount: 0 },
    { category: "PDA Canal", description: "", amount: 0 },
    { category: "AWRP", description: "", amount: 0 },
    { category: "Armed Guard", description: "", amount: 0 },
    { category: "Komisyonlar", description: "", amount: 0 },
    { category: "Other", description: "", amount: 0 },
  ])

  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([])

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchShips()
    if (calculationId) {
      fetchCalculation()
    }
  }, [calculationId])

  useEffect(() => {
    // Skip auto-save on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }

    // Skip if no calculation name or ship name
    if (!name || !shipName || !calculationId) {
      return
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave()
    }, 2000)

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [
    name,
    shipId,
    shipName,
    charterer,
    serviceSpeed,
    runningCost,
    foPrice,
    mgoPrice,
    legs,
    operations,
    costItems,
    revenueItems,
  ])

  const handleAutoSave = async () => {
    if (!calculationId) return

    setAutoSaving(true)
    try {
      const data = {
        name,
        ship_id: shipId === "manual" ? null : shipId,
        ship_name: shipName,
        charterer,
        service_speed: Number.parseFloat(serviceSpeed) || 0,
        running_cost_per_day: Number.parseFloat(runningCost) || 0,
        fuel_consumption: fuelConsumption,
        fo_price: Number.parseFloat(foPrice) || 0,
        mgo_price: Number.parseFloat(mgoPrice) || 0,
        operations,
        cost_items: costItems,
        revenue_items: revenueItems,
        total_days: totalVoyageDays,
        total_fo_consumption: operationFuelCost.totalFO,
        total_mgo_consumption: operationFuelCost.totalMGO,
        fuel_cost: operationFuelCost.cost,
        running_cost: runningCostTotal,
        other_costs: otherCosts,
        total_cost: totalCost,
        total_revenue: totalRevenue,
        net_profit: netProfit,
        legs,
      }

      // FIX: Fixed JSON.JSON.stringify typo to JSON.stringify
      await fetch(`/api/voyage-calculator/${calculationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error("[v0] Auto-save error:", error)
    } finally {
      setAutoSaving(false)
    }
  }

  const fetchShips = async () => {
    try {
      const response = await fetch("/api/ships")
      if (response.ok) {
        const data = await response.json()
        setShips(data)
      }
    } catch (error) {
      console.error("[v0] Fetch ships error:", error)
    }
  }

  const fetchCalculation = async () => {
    if (!calculationId) return

    try {
      const response = await fetch(`/api/voyage-calculator/${calculationId}`)
      if (response.ok) {
        const data = await response.json()
        setName(data.name || "")
        setShipId(data.ship_id || "")
        setShipName(data.ship_name || "")
        setCharterer(data.charterer || "")
        setServiceSpeed(data.service_speed?.toString() || "")
        setRunningCost(data.running_cost_per_day?.toString() || "")
        setFuelConsumption(data.fuel_consumption || {})
        setFoPrice(data.fo_price?.toString() || "")
        setMgoPrice(data.mgo_price?.toString() || "")
        setLegs(data.legs || [])
        setCosts(data.costs || [])
        setRevenues(data.revenues || [])
        setTags(data.tags || [])
        setStatus(data.status || "draft")

        if (data.operations) {
          // Ensure new boolean flags are handled when fetching data
          setOperations({
            loading_days: data.operations.loading_days || 0,
            discharge_days: data.operations.discharge_days || 0,
            anchor_days: data.operations.anchor_days || 0,
            idle_days: data.operations.idle_days || 0,
            inerting_days: data.operations.inerting_days || 0,
            washing_days: data.operations.washing_days || 0,
            heating_days: data.operations.heating_days || 0,
            incinerator_days: data.operations.incinerator_days || 0,
            include_inerting_in_total: data.operations.include_inerting_in_total ?? true,
            include_washing_in_total: data.operations.include_washing_in_total ?? true,
            include_heating_in_total: data.operations.include_heating_in_total ?? true,
            include_incinerator_in_total: data.operations.include_incinerator_in_total ?? true,
          })
        }

        if (data.cost_items && Array.isArray(data.cost_items)) {
          // Start with the default categories
          const defaultCategories = [
            "PDA Yükleme Limanı",
            "PDA Tahliye Limanı",
            "PDA Transit",
            "PDA Canal",
            "AWRP",
            "Armed Guard",
            "Komisyonlar",
            "Other",
          ]

          // Create a map of loaded items by category
          // Map'in değer tipi açıkça verilir; aksi halde TypeScript boş nesne ({})
          // çıkarımı yapıyor ve item alanları görünmüyor.
          const loadedItemsMap = new Map<string, { description?: string; amount?: number }>(
            data.cost_items.map((item: any) => [item.category, item]),
          )

          // Merge: use loaded values if they exist, otherwise use defaults
          const mergedCostItems = defaultCategories.map((category) => {
            const loadedItem = loadedItemsMap.get(category)
            return {
              category,
              description: loadedItem?.description || "",
              amount: Number(loadedItem?.amount) || 0,
            }
          })

          setCostItems(mergedCostItems)
        }

        if (data.revenue_items && Array.isArray(data.revenue_items)) {
          const normalizedRevenueItems = data.revenue_items.map((item: any) => ({
            type: item.type || "freight",
            description: item.description || "",
            amount: Number(item.amount) || 0,
          }))
          setRevenueItems(normalizedRevenueItems)
        }
      }
    } catch (error) {
      console.error("[v0] Fetch calculation error:", error)
    }
  }

  const handleShipChange = (selectedShipId: string) => {
    setShipId(selectedShipId)

    if (selectedShipId === "manual") {
      setShipName("")
      setFuelConsumption({})
      return
    }

    const ship = ships.find((s) => s.id === selectedShipId)
    if (ship) {
      setShipName(ship.name)
      setFuelConsumption(ship.consumption_operations || {})
    }
  }

  const calculateLeg = (leg: Leg) => {
    const speed = Number.parseFloat(serviceSpeed) || 0

    console.log("[v0] Calculating leg:", {
      distance: leg.distance_nm,
      speed,
      condition: leg.condition,
      hasSpeed: speed > 0,
      hasDistance: !!leg.distance_nm,
    })

    if (speed === 0 || !leg.distance_nm) {
      console.log("[v0] Cannot calculate: speed or distance is 0")
      return leg
    }

    const seaDays = leg.distance_nm / (speed * 24)
    const condition = leg.condition

    // Get fuel consumption based on condition
    const foRate = fuelConsumption?.[condition]?.fo || 0
    const mgoRate = fuelConsumption?.[condition]?.mgo || 0

    console.log("[v0] Calculated sea days:", seaDays, "FO:", seaDays * foRate, "MGO:", seaDays * mgoRate)

    return {
      ...leg,
      sea_days: seaDays,
      fo_consumption: seaDays * foRate,
      mgo_consumption: seaDays * mgoRate,
    }
  }

  const addLeg = () => {
    setLegs([...legs, { from_port: "", to_port: "", distance_nm: 0, condition: "laden" }])
  }

  const updateLeg = (index: number, field: keyof Leg, value: any) => {
    console.log("[v0] Updating leg:", index, field, value)
    const newLegs = [...legs]
    newLegs[index] = { ...newLegs[index], [field]: value }
    newLegs[index] = calculateLeg(newLegs[index])
    console.log("[v0] Updated leg result:", newLegs[index])
    setLegs(newLegs)
  }

  const handlePortSelect = async (index: number, portType: "from" | "to", portData: any) => {
    console.log("[v0] Port selected:", portType, portData)
    const newLegs = [...legs]

    if (portType === "from") {
      newLegs[index].from_port = portData.port_name
      newLegs[index].from_port_uuid = portData.id // Updated to use id
      newLegs[index].from_port_unlocode = portData.unlocode
    } else {
      newLegs[index].to_port = portData.port_name
      newLegs[index].to_port_uuid = portData.id // Updated to use id
      newLegs[index].to_port_unlocode = portData.unlocode
    }

    if (newLegs[index].from_port_uuid && newLegs[index].to_port_uuid && portData.lat && portData.lon) {
      console.log("[v0] Both ports selected, calculating distance...")
      try {
        // Get both port data
        const fromPort =
          portType === "from" ? portData : legs.find((l) => l.from_port_uuid === newLegs[index].from_port_uuid)
        const toPort = portType === "to" ? portData : legs.find((l) => l.to_port_uuid === newLegs[index].to_port_uuid)

        // If we have both ports with coordinates, calculate distance
        if (fromPort && toPort && fromPort.lat && fromPort.lon && toPort.lat && toPort.lon) {
          // Haversine formula to calculate great-circle distance
          const R = 3440.065 // Earth's radius in nautical miles
          const lat1 = (fromPort.lat * Math.PI) / 180
          const lat2 = (toPort.lat * Math.PI) / 180
          const deltaLat = ((toPort.lat - fromPort.lat) * Math.PI) / 180
          const deltaLon = ((toPort.lon - fromPort.lon) * Math.PI) / 180

          const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = R * c

          newLegs[index].distance_nm = Math.round(distance)
          console.log("[v0] Distance calculated:", newLegs[index].distance_nm, "NM")

          alert(
            `Mesafe otomatik hesaplandı: ${newLegs[index].distance_nm} deniz mili\n\n` +
              `Not: Bu, iki liman arasındaki büyük daire mesafesidir (Haversine formülü). Gerçek deniz rotası farklı olabilir.`,
          )
        } else {
          console.log("[v0] Waiting for both ports to be selected or coordinates...")
        }
      } catch (error) {
        console.error("[v0] Distance calculation error:", error)
        alert("Mesafe hesaplanırken bir hata oluştu. Lütfen mesafeyi manuel olarak girin.")
      }
    }

    newLegs[index] = calculateLeg(newLegs[index])
    setLegs(newLegs)
  }

  const removeLeg = (index: number) => {
    setLegs(legs.filter((_, i) => i !== index))
  }

  const addCost = () => {
    // This function is now mostly superseded by the costItems logic, but kept for potential backward compatibility or if old structure is still used in API.
    setCosts([...costs, { description: "", amount: 0 }])
  }

  const updateCost = (index: number, field: keyof OldCost, value: any) => {
    // This function is now mostly superseded by the costItems logic.
    const newCosts = [...costs]
    newCosts[index] = { ...newCosts[index], [field]: value }
    setCosts(newCosts)
  }

  const removeCost = (index: number) => {
    // This function is now mostly superseded by the costItems logic.
    setCosts(costs.filter((_, i) => i !== index))
  }

  const addRevenue = () => {
    // This function is now mostly superseded by the revenueItems logic.
    setRevenues([...revenues, { description: "", amount: 0 }])
  }

  const updateRevenue = (index: number, field: keyof Revenue, value: any) => {
    // This function is now mostly superseded by the revenueItems logic.
    const newRevenues = [...revenues]
    newRevenues[index] = { ...newRevenues[index], [field]: value }
    setRevenues(newRevenues)
  }

  const removeRevenue = (index: number) => {
    // This function is now mostly superseded by the revenueItems logic.
    setRevenues(revenues.filter((_, i) => i !== index))
  }

  // Calculate totals
  const totalSeaDays = legs.reduce((sum, leg) => sum + (leg.sea_days || 0), 0)
  const totalFO = legs.reduce((sum, leg) => sum + (leg.fo_consumption || 0), 0)
  const totalMGO = legs.reduce((sum, leg) => sum + (leg.mgo_consumption || 0), 0)
  const fuelCost = totalFO * (Number.parseFloat(foPrice) || 0) + totalMGO * (Number.parseFloat(mgoPrice) || 0)
  // This `runningCostTotal` will be recalculated based on `totalVoyageDays` below.
  // const runningCostTotal = totalSeaDays * (Number.parseFloat(runningCost) || 0)
  // This `otherCosts` will be recalculated based on `costItems` below.
  // const otherCosts = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0)
  // const totalCost = fuelCost + runningCostTotal + otherCosts
  // This `totalRevenue` will be recalculated based on `revenueItems` below.
  // const totalRevenue = revenues.reduce((sum, rev) => sum + (rev.amount || 0), 0)
  // const netProfit = totalRevenue - totalCost

  const ladenDays = legs.filter((leg) => leg.condition === "laden").reduce((sum, leg) => sum + (leg.sea_days || 0), 0)

  const ballastDays = legs
    .filter((leg) => leg.condition === "ballast")
    .reduce((sum, leg) => sum + (leg.sea_days || 0), 0)

  const operationFuelCost = (() => {
    const foPriceNum = Number.parseFloat(foPrice) || 0
    const mgoPriceNum = Number.parseFloat(mgoPrice) || 0

    let totalFO = 0
    let totalMGO = 0

    // Loading
    const loadingFO = (fuelConsumption?.loading?.fo || 0) * operations.loading_days
    const loadingMGO = (fuelConsumption?.loading?.mgo || 0) * operations.loading_days
    totalFO += loadingFO
    totalMGO += loadingMGO

    // Discharge
    const dischargeFO = (fuelConsumption?.discharge?.fo || 0) * operations.discharge_days
    const dischargeMGO = (fuelConsumption?.discharge?.mgo || 0) * operations.discharge_days
    totalFO += dischargeFO
    totalMGO += dischargeMGO

    // Laden voyage (auto from legs)
    const ladenFO = (fuelConsumption?.laden?.fo || 0) * ladenDays
    const ladenMGO = (fuelConsumption?.laden?.mgo || 0) * ladenDays
    totalFO += ladenFO
    totalMGO += ladenMGO

    // Ballast voyage (auto from legs)
    const ballastFO = (fuelConsumption?.ballast?.fo || 0) * ballastDays
    const ballastMGO = (fuelConsumption?.ballast?.mgo || 0) * ballastDays
    totalFO += ballastFO
    totalMGO += ballastMGO

    // Anchor
    const anchorFO = (fuelConsumption?.anchor?.fo || 0) * operations.anchor_days
    const anchorMGO = (fuelConsumption?.anchor?.mgo || 0) * operations.anchor_days
    totalFO += anchorFO
    totalMGO += anchorMGO

    // Idle
    const idleFO = (fuelConsumption?.idle?.fo || 0) * operations.idle_days
    const idleMGO = (fuelConsumption?.idle?.mgo || 0) * operations.idle_days
    totalFO += idleFO
    totalMGO += idleMGO

    // Inerting
    const inertingFO = (fuelConsumption?.inerting?.fo || 0) * operations.inerting_days
    const inertingMGO = (fuelConsumption?.inerting?.mgo || 0) * operations.inerting_days
    totalFO += inertingFO
    totalMGO += inertingMGO

    // Washing
    const washingFO = (fuelConsumption?.washing?.fo || 0) * operations.washing_days
    const washingMGO = (fuelConsumption?.washing?.mgo || 0) * operations.washing_days
    totalFO += washingFO
    totalMGO += washingMGO

    // Heating
    const heatingFO = (fuelConsumption?.heating?.fo || 0) * operations.heating_days
    const heatingMGO = (fuelConsumption?.heating?.mgo || 0) * operations.heating_days
    totalFO += heatingFO
    totalMGO += heatingMGO

    // Incinerator
    const incineratorFO = (fuelConsumption?.incinerator?.fo || 0) * operations.incinerator_days
    const incineratorMGO = (fuelConsumption?.incinerator?.mgo || 0) * operations.incinerator_days
    totalFO += incineratorFO
    totalMGO += incineratorMGO

    return {
      totalFO,
      totalMGO,
      cost: totalFO * foPriceNum + totalMGO * mgoPriceNum,
    }
  })()

  const totalVoyageDays =
    ladenDays +
    ballastDays +
    operations.loading_days +
    operations.discharge_days +
    operations.anchor_days +
    operations.idle_days +
    (operations.include_inerting_in_total ? operations.inerting_days : 0) +
    (operations.include_washing_in_total ? operations.washing_days : 0) +
    (operations.include_heating_in_total ? operations.heating_days : 0) +
    (operations.include_incinerator_in_total ? operations.incinerator_days : 0)

  const runningCostTotal = totalVoyageDays * (Number.parseFloat(runningCost) || 0)

  const otherCosts = costItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const totalCost = operationFuelCost.cost + runningCostTotal + otherCosts

  const totalRevenue = revenueItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const netProfit = totalRevenue - totalCost

  const tceProfit = totalVoyageDays > 0 ? netProfit / totalVoyageDays : 0

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!name || !shipName) {
      alert("Lütfen hesaplama adı ve gemi adı girin")
      return
    }

    setSaving(true)
    try {
      const data = {
        name,
        ship_id: shipId === "manual" ? null : shipId,
        ship_name: shipName,
        charterer,
        service_speed: Number.parseFloat(serviceSpeed) || 0,
        running_cost_per_day: Number.parseFloat(runningCost) || 0,
        fuel_consumption: fuelConsumption,
        fo_price: Number.parseFloat(foPrice) || 0,
        mgo_price: Number.parseFloat(mgoPrice) || 0,
        operations,
        cost_items: costItems,
        revenue_items: revenueItems,
        tags,
        status,
        total_days: totalVoyageDays,
        total_fo_consumption: operationFuelCost.totalFO,
        total_mgo_consumption: operationFuelCost.totalMGO,
        fuel_cost: operationFuelCost.cost,
        running_cost: runningCostTotal,
        other_costs: otherCosts,
        total_cost: totalCost,
        total_revenue: totalRevenue,
        net_profit: netProfit,
        // Added TCE to save data
        tce_profit: tceProfit,
        legs,
        // The original 'costs' and 'revenues' arrays are likely deprecated in favor of costItems and revenueItems.
        // Depending on backend expectations, you might need to include them or remove them.
        // For now, they are commented out to reflect the new structure.
        // costs: costs, // Potentially deprecated
        // revenues: revenues, // Potentially deprecated
      }

      const url = calculationId ? `/api/voyage-calculator/${calculationId}` : "/api/voyage-calculator"
      const method = calculationId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        onClose()
      } else {
        alert("Kaydetme hatası")
      }
    } catch (error) {
      console.error("[v0] Save calculation error:", error)
      alert("Kaydetme hatası")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {calculationId ? "Hesaplamayı Düzenle" : "Yeni Sefer Hesaplama"}
            </h1>
            {autoSaving && <p className="text-sm text-muted-foreground mt-1">Otomatik kaydediliyor...</p>}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-5 w-5" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <div className="relative">
          <TabsList className="grid w-full grid-cols-7 h-auto p-1.5 bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm rounded-xl border shadow-lg">
            <TabsTrigger
              value="basic"
              className="flex flex-col items-center gap-2 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-lg hover:bg-muted/50"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs font-semibold">Temel</span>
            </TabsTrigger>
            <TabsTrigger
              value="legs"
              className="flex flex-col items-center gap-2 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-lg hover:bg-muted/50"
            >
              <Route className="h-5 w-5" />
              <span className="text-xs font-semibold">Rota</span>
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="flex flex-col items-center gap-2 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-lg hover:bg-muted/50"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs font-semibold">Operasyon</span>
            </TabsTrigger>
            <TabsTrigger
              value="costs"
              className="flex flex-col items-center gap-2 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg hover:bg-muted/50"
            >
              <TrendingDown className="h-5 w-5" />
              <span className="text-xs font-semibold">Maliyet</span>
            </TabsTrigger>
            <TabsTrigger
              value="revenues"
              className="flex flex-col items-center gap-2 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg hover:bg-muted/50"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs font-semibold">Gelir</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex flex-col items-center gap-2 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg hover:bg-muted/50"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-semibold">Özet</span>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="flex flex-col items-center gap-2 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg hover:bg-muted/50"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-semibold">Gelişmiş</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="space-y-6">
          <Card className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Hesaplama Adı *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: İstanbul-Rotterdam Seferi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ship">Gemi Seçimi *</Label>
                <Select value={shipId} onValueChange={handleShipChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {ships.map((ship) => (
                      <SelectItem key={ship.id} value={ship.id}>
                        {ship.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="manual">Manuel Gemi Adı Gir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shipId === "manual" && (
                <div className="space-y-2">
                  <Label htmlFor="shipName">Gemi Adı *</Label>
                  <Input
                    id="shipName"
                    value={shipName}
                    onChange={(e) => setShipName(e.target.value)}
                    placeholder="Gemi adını girin"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="charterer">Potansiyel Kiracı</Label>
                <Input
                  id="charterer"
                  value={charterer}
                  onChange={(e) => setCharterer(e.target.value)}
                  placeholder="Kiracı adı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speed">Servis Hızı (knot)</Label>
                <Input
                  id="speed"
                  type="number"
                  step="0.1"
                  value={serviceSpeed}
                  onChange={(e) => setServiceSpeed(e.target.value)}
                  placeholder="14.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="running">Running Cost ($/gün)</Label>
                <Input
                  id="running"
                  type="number"
                  step="100"
                  value={runningCost}
                  onChange={(e) => setRunningCost(e.target.value)}
                  placeholder="5000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foPrice">FO Fiyatı ($/MT)</Label>
                <Input
                  id="foPrice"
                  type="number"
                  step="10"
                  value={foPrice}
                  onChange={(e) => setFoPrice(e.target.value)}
                  placeholder="500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mgoPrice">MGO Fiyatı ($/MT)</Label>
                <Input
                  id="mgoPrice"
                  type="number"
                  step="10"
                  value={mgoPrice}
                  onChange={(e) => setMgoPrice(e.target.value)}
                  placeholder="700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="approved">Onaylandı</SelectItem>
                    <SelectItem value="rejected">Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Etiketler</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Etiket ekle (Enter ile)"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Ekle
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="legs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Rota Bacakları</h3>
            <Button onClick={addLeg} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Bacak Ekle
            </Button>
          </div>

          {legs.map((leg, index) => (
            <Card key={index} className="p-4">
              <div className="grid gap-4 md:grid-cols-6">
                <div className="space-y-2">
                  <Label>Çıkış Limanı</Label>
                  <PortSearchInput
                    value={leg.from_port}
                    onChange={(value) => updateLeg(index, "from_port", value)}
                    onPortSelect={(portData) => handlePortSelect(index, "from", portData)}
                    placeholder="İstanbul"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Varış Limanı</Label>
                  <PortSearchInput
                    value={leg.to_port}
                    onChange={(value) => updateLeg(index, "to_port", value)}
                    onPortSelect={(portData) => handlePortSelect(index, "to", portData)}
                    placeholder="Rotterdam"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mesafe (NM)</Label>
                  <Input
                    type="number"
                    value={leg.distance_nm}
                    onChange={(e) => updateLeg(index, "distance_nm", Number.parseFloat(e.target.value) || 0)}
                    placeholder="2500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={leg.condition} onValueChange={(v) => updateLeg(index, "condition", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laden">Yüklü</SelectItem>
                      <SelectItem value="ballast">Boş</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deniz Günü</Label>
                  <Input value={leg.sea_days?.toFixed(2) || "0"} disabled />
                </div>

                <div className="flex items-end">
                  <Button variant="ghost" size="icon" onClick={() => removeLeg(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Operasyon Kalemleri</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Yakıt tüketim oranları gemiden otomatik yüklendi. Sadece gün bilgilerini girin.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operasyon</TableHead>
                  <TableHead className="text-right">Gün</TableHead>
                  <TableHead className="text-right">FO (MT/gün)</TableHead>
                  <TableHead className="text-right">MGO (MT/gün)</TableHead>
                  <TableHead className="text-right">Toplam FO</TableHead>
                  <TableHead className="text-right">Toplam MGO</TableHead>
                  {/* Added header for the new checkbox column */}
                  <TableHead className="text-center">Toplam Gün'e Dahil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Yükleme</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.loading_days}
                      onChange={(e) =>
                        setOperations({ ...operations, loading_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.loading?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.loading?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.loading?.fo || 0) * operations.loading_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.loading?.mgo || 0) * operations.loading_days).toFixed(2)}
                  </TableCell>
                  {/* Loading and Discharge are always included */}
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Tahliye</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.discharge_days}
                      onChange={(e) =>
                        setOperations({ ...operations, discharge_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.discharge?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.discharge?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.discharge?.fo || 0) * operations.discharge_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.discharge?.mgo || 0) * operations.discharge_days).toFixed(2)}
                  </TableCell>
                  {/* Loading and Discharge are always included */}
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Yüklü Seyir</TableCell>
                  <TableCell className="text-right font-medium">{ladenDays.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.laden?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.laden?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {((fuelConsumption?.laden?.fo || 0) * ladenDays).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {((fuelConsumption?.laden?.mgo || 0) * ladenDays).toFixed(2)}
                  </TableCell>
                  {/* Voyage days are always included */}
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Boş Seyir</TableCell>
                  <TableCell className="text-right font-medium">{ballastDays.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.ballast?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.ballast?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {((fuelConsumption?.ballast?.fo || 0) * ballastDays).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {((fuelConsumption?.ballast?.mgo || 0) * ballastDays).toFixed(2)}
                  </TableCell>
                  {/* Voyage days are always included */}
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Demirde</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.anchor_days}
                      onChange={(e) =>
                        setOperations({ ...operations, anchor_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.anchor?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.anchor?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.anchor?.fo || 0) * operations.anchor_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.anchor?.mgo || 0) * operations.anchor_days).toFixed(2)}
                  </TableCell>
                  {/* Anchor days are always included */}
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Boşta</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.idle_days}
                      onChange={(e) =>
                        setOperations({ ...operations, idle_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.idle?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.idle?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.idle?.fo || 0) * operations.idle_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.idle?.mgo || 0) * operations.idle_days).toFixed(2)}
                  </TableCell>
                  {/* Idle days are always included */}
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Inerting</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.inerting_days}
                      onChange={(e) =>
                        setOperations({ ...operations, inerting_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.inerting?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.inerting?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.inerting?.fo || 0) * operations.inerting_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.inerting?.mgo || 0) * operations.inerting_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={operations.include_inerting_in_total ?? true}
                      onChange={(e) => setOperations({ ...operations, include_inerting_in_total: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                      title="Toplam sefer gününe dahil et"
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Washing</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.washing_days}
                      onChange={(e) =>
                        setOperations({ ...operations, washing_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.washing?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.washing?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.washing?.fo || 0) * operations.washing_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.washing?.mgo || 0) * operations.washing_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={operations.include_washing_in_total ?? true}
                      onChange={(e) => setOperations({ ...operations, include_washing_in_total: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                      title="Toplam sefer gününe dahil et"
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Heating</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.heating_days}
                      onChange={(e) =>
                        setOperations({ ...operations, heating_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.heating?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.heating?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.heating?.fo || 0) * operations.heating_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.heating?.mgo || 0) * operations.heating_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={operations.include_heating_in_total ?? true}
                      onChange={(e) => setOperations({ ...operations, include_heating_in_total: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                      title="Toplam sefer gününe dahil et"
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Incinerator</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.1"
                      value={operations.incinerator_days}
                      onChange={(e) =>
                        setOperations({ ...operations, incinerator_days: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.incinerator?.fo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fuelConsumption?.incinerator?.mgo?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.incinerator?.fo || 0) * operations.incinerator_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((fuelConsumption?.incinerator?.mgo || 0) * operations.incinerator_days).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={operations.include_incinerator_in_total ?? true}
                      onChange={(e) => setOperations({ ...operations, include_incinerator_in_total: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                      title="Toplam sefer gününe dahil et"
                    />
                  </TableCell>
                </TableRow>

                <TableRow className="font-bold border-t-2">
                  <TableCell>TOPLAM</TableCell>
                  <TableCell className="text-right">{totalVoyageDays.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">{operationFuelCost.totalFO.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{operationFuelCost.totalMGO.toFixed(2)}</TableCell>
                  {/* Empty cell for the checkbox column */}
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Toplam Yakıt Maliyeti:</span>
                <span className="text-xl font-bold">${operationFuelCost.cost.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Maliyet Kalemleri</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tüm maliyet kalemlerini girin ve kaydedin. Varsayılan USD birimi cinsinden.
            </p>

            <div className="space-y-3">
              {costItems.map((item, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-3 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{item.category}</Label>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={item.description || ""}
                      onChange={(e) => {
                        const newItems = [...costItems]
                        newItems[index].description = e.target.value
                        setCostItems(newItems)
                      }}
                      placeholder="Açıklama"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      step="100"
                      value={item.amount || 0}
                      onChange={(e) => {
                        const newItems = [...costItems]
                        newItems[index].amount = Number.parseFloat(e.target.value) || 0
                        setCostItems(newItems)
                      }}
                      placeholder="Tutar ($)"
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-3 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Running Cost</Label>
                    <p className="text-xs text-muted-foreground">
                      {(Number.parseFloat(runningCost) || 0).toLocaleString()} $/gün × {totalVoyageDays.toFixed(2)} gün
                    </p>
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Input value={runningCostTotal.toLocaleString()} disabled className="font-semibold" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Diğer Maliyetler:</span>
                  <span className="font-medium">${otherCosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Running Cost:</span>
                  <span className="font-medium">${runningCostTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Toplam Maliyet (Yakıt Hariç):</span>
                  <span>${(otherCosts + runningCostTotal).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="revenues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gelir Kalemleri</h3>
            <Button
              onClick={() => setRevenueItems([...revenueItems, { type: "freight", description: "", amount: 0 }])}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Gelir Ekle
            </Button>
          </div>

          {revenueItems.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Tür</Label>
                  <Select
                    value={item.type}
                    onValueChange={(value) => {
                      const newItems = [...revenueItems]
                      newItems[index].type = value
                      setRevenueItems(newItems)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freight">Navlun</SelectItem>
                      <SelectItem value="demurrage">Demurrage</SelectItem>
                      <SelectItem value="despatch">Despatch</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Açıklama</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...revenueItems]
                      newItems[index].description = e.target.value
                      setRevenueItems(newItems)
                    }}
                    placeholder="Gelir açıklaması"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tutar (USD)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="1000"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...revenueItems]
                        newItems[index].amount = Number.parseFloat(e.target.value) || 0
                        setRevenueItems(newItems)
                      }}
                      placeholder="150000"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRevenueItems(revenueItems.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {revenueItems.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Henüz gelir kalemi eklenmedi</p>
              <Button
                onClick={() => setRevenueItems([{ type: "freight", description: "", amount: 0 }])}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                İlk Geliri Ekle
              </Button>
            </Card>
          )}

          {revenueItems.length > 0 && (
            <Card className="p-4 bg-muted">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Toplam Gelir:</span>
                <span className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</span>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Sefer Özeti</h3>
              <VoyageCalculatorExport
                data={{
                  name,
                  shipName,
                  charterer,
                  totalDays: totalVoyageDays,
                  fuelCost: operationFuelCost.cost,
                  runningCost: runningCostTotal,
                  otherCosts,
                  totalCost,
                  totalRevenue,
                  netProfit,
                  tceProfit,
                  legs,
                  operations,
                  costItems,
                  revenueItems,
                  totalFO: operationFuelCost.totalFO,
                  totalMGO: operationFuelCost.totalMGO,
                  ladenDays,
                  ballastDays,
                }}
              />
            </div>

            <div className="mb-6">
              <VoyageCalculatorCharts
                data={{
                  fuelCost: operationFuelCost.cost,
                  runningCost: runningCostTotal,
                  otherCosts,
                  totalRevenue,
                }}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Operasyonel Bilgiler</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Sefer Günü:</span>
                    <span className="font-medium">{totalVoyageDays.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">- Yüklü Seyir:</span>
                    <span className="font-medium">{ladenDays.toFixed(2)} gün</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">- Boş Seyir:</span>
                    <span className="font-medium">{ballastDays.toFixed(2)} gün</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Toplam FO Tüketimi:</span>
                    <span className="font-medium">{operationFuelCost.totalFO.toFixed(2)} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam MGO Tüketimi:</span>
                    <span className="font-medium">{operationFuelCost.totalMGO.toFixed(2)} MT</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Finansal Özet</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yakıt Maliyeti:</span>
                    <span className="font-medium">${operationFuelCost.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Running Cost:</span>
                    <span className="font-medium">${runningCostTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diğer Maliyetler:</span>
                    <span className="font-medium">${otherCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Toplam Maliyet:</span>
                    <span>${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Toplam Gelir:</span>
                    <span>${totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Net Kar/Zarar:</span>
                    <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                      ${netProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2">
                    <span>TCE Kar/Zarar ($/gün):</span>
                    <span className={tceProfit >= 0 ? "text-green-600" : "text-red-600"}>
                      ${tceProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <VoyageCalculatorScenario
              baseFoPrice={Number.parseFloat(foPrice) || 0}
              baseMgoPrice={Number.parseFloat(mgoPrice) || 0}
              baseRevenue={totalRevenue}
              totalFO={operationFuelCost.totalFO}
              totalMGO={operationFuelCost.totalMGO}
              runningCost={runningCostTotal}
              otherCosts={otherCosts}
              onScenarioChange={(scenario) => {
                // Scenario results are displayed in the component
              }}
            />

            <VoyageCalculatorWeather
              baseSpeed={Number.parseFloat(serviceSpeed) || 0}
              baseFuelConsumption={operationFuelCost.totalFO / totalVoyageDays || 0}
              totalDays={totalVoyageDays}
              onWeatherAdjustment={(adjustment) => {
                // Weather adjustments are displayed in the component
              }}
            />
          </div>

          <VoyageCalculatorInflation baseCost={totalCost} voyageDays={totalVoyageDays} />

          <div>
            <h3 className="text-lg font-semibold mb-4">Döviz Çevirici</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <VoyageCalculatorCurrency usdAmount={totalCost} label="Toplam Maliyet" />
              <VoyageCalculatorCurrency usdAmount={totalRevenue} label="Toplam Gelir" />
              <VoyageCalculatorCurrency usdAmount={netProfit} label="Net Kar/Zarar" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
