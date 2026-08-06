"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardStats } from "@/components/dashboard-stats"
import { CompanyList } from "@/components/company-list"
import { RecentActivity } from "@/components/recent-activity"
import { DashboardLayoutSelector } from "@/components/dashboard-layout-selector"
import { DashboardWidgetManager } from "@/components/dashboard-widget-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import type { JSX } from "react/jsx-runtime"
import { CustomLayoutBuilder } from "@/components/custom-layout-builder"
import { UpcomingLaycansWidget } from "@/components/upcoming-laycans-widget"
import { ActiveVoyagesWidget } from "@/components/active-voyages-widget"
import { PendingActionsWidget } from "@/components/pending-actions-widget"
import { RecentDocumentsWidget } from "@/components/recent-documents-widget"
import { FleetPerformanceWidget } from "@/components/fleet-performance-widget"
import { FuelCostWidget } from "@/components/fuel-cost-widget"
import { PortStatisticsWidget } from "@/components/port-statistics-widget"
import { WeatherWidget } from "@/components/weather-widget"
import { MarketPricesWidget } from "@/components/market-prices-widget"
import { PerformanceComparisonWidget } from "@/components/performance-comparison-widget"
import { FinancialForecastWidget } from "@/components/financial-forecast-widget"
import { ComplianceWidget } from "@/components/compliance-widget"
import { AllShipsWidget } from "@/components/all-ships-widget"
import { TasksWidget } from "@/components/tasks-widget"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [preferences, setPreferences] = useState({
    layoutType: "grid-2col",
    visibleWidgets: ["stats", "activity", "financial", "companies"],
    widgetPositions: {} as Record<string, { area: string; order: number }>,
    customLayouts: [] as Array<{
      id: string
      name: string
      areas: Array<{ id: string; width: string; order: number }>
    }>,
  })

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch user
        const userRes = await fetch("/api/auth/me")
        if (!userRes.ok) {
          router.push("/auth/signin")
          return
        }
        const userData = await userRes.json()
        setUser(userData)

        // Fetch preferences
        const prefsRes = await fetch("/api/dashboard/preferences")
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json()
          setPreferences({
            layoutType: prefsData.layout_type || "grid-2col",
            visibleWidgets: prefsData.visible_widgets || ["stats", "activity", "financial", "companies"],
            widgetPositions: prefsData.widget_positions || {},
            customLayouts: prefsData.custom_layouts || [],
          })
        }

        // Fetch dashboard data
        const [companiesRes, fleetsRes, shipsRes, fixturesRes, voyagesRes, invoicesRes] = await Promise.all([
          fetch("/api/companies"),
          fetch("/api/fleets"),
          fetch("/api/ships"),
          fetch("/api/fixtures"),
          fetch("/api/voyages"),
          fetch("/api/invoices"),
        ])

        let companies = []
        let fleets = []
        let ships = []
        let fixtures = []
        let voyages = []
        let invoices = []

        try {
          const companiesData = await companiesRes.json()
          companies = Array.isArray(companiesData) ? companiesData : []
        } catch (e) {
          console.error("[v0] Error parsing companies:", e)
        }

        try {
          const fleetsData = await fleetsRes.json()
          fleets = Array.isArray(fleetsData) ? fleetsData : []
        } catch (e) {
          console.error("[v0] Error parsing fleets:", e)
        }

        try {
          const shipsData = await shipsRes.json()
          ships = Array.isArray(shipsData) ? shipsData : []
        } catch (e) {
          console.error("[v0] Error parsing ships:", e)
        }

        try {
          const fixturesData = await fixturesRes.json()
          fixtures = Array.isArray(fixturesData) ? fixturesData : []
        } catch (e) {
          console.error("[v0] Error parsing fixtures:", e)
        }

        try {
          const voyagesData = await voyagesRes.json()
          voyages = Array.isArray(voyagesData) ? voyagesData : []
        } catch (e) {
          console.error("[v0] Error parsing voyages:", e)
        }

        try {
          const invoicesData = await invoicesRes.json()
          invoices = Array.isArray(invoicesData) ? invoicesData : []
        } catch (e) {
          console.error("[v0] Error parsing invoices:", e)
        }

        const activeShips = ships.filter((s: any) => s.status === "active")
        const activeFixtures = fixtures.filter((f: any) => f.status === "active")
        const activeVoyages = voyages.filter(
          (v: any) => v.status === "loading" || v.status === "loaded" || v.status === "discharging",
        )
        const pendingInvoices = invoices.filter((i: any) => i.status === "pending")

        const totalRevenue = invoices
          .filter((i: any) => i.type === "income")
          .reduce((sum: number, i: any) => sum + Number(i.amount), 0)

        const totalExpense = invoices
          .filter((i: any) => i.type === "expense")
          .reduce((sum: number, i: any) => sum + Number(i.amount), 0)

        setData({
          companies,
          fleets,
          ships,
          fixtures,
          voyages,
          invoices,
          stats: {
            totalCompanies: companies.length,
            totalFleets: fleets.length,
            totalShips: ships.length,
            activeShips: activeShips.length,
            activeFixtures: activeFixtures.length,
            totalVoyages: voyages.length,
            activeVoyages: activeVoyages.length,
            totalInvoices: invoices.length,
            pendingInvoices: pendingInvoices.length,
            totalRevenue,
            totalExpense,
            netProfit: totalRevenue - totalExpense,
          },
        })
      } catch (error) {
        console.error("Error loading dashboard:", error)
        setData({
          companies: [],
          fleets: [],
          ships: [],
          fixtures: [],
          voyages: [],
          invoices: [],
          stats: {
            totalCompanies: 0,
            totalFleets: 0,
            totalShips: 0,
            activeShips: 0,
            activeFixtures: 0,
            totalVoyages: 0,
            activeVoyages: 0,
            totalInvoices: 0,
            pendingInvoices: 0,
            totalRevenue: 0,
            totalExpense: 0,
            netProfit: 0,
          },
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLayoutChange = async (layoutType: string) => {
    try {
      await fetch("/api/dashboard/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, layoutType }),
      })
      setPreferences((prev) => ({ ...prev, layoutType }))
    } catch (error) {
      console.error("Error saving layout:", error)
    }
  }

  const handleWidgetChange = async (data: {
    visibleWidgets: string[]
    widgetPositions: Record<string, { area: string; order: number }>
  }) => {
    try {
      await fetch("/api/dashboard/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, ...data }),
      })
      setPreferences((prev) => ({ ...prev, ...data }))
    } catch (error) {
      console.error("Error saving widgets:", error)
    }
  }

  const handleCustomLayoutsChange = async (customLayouts: any[]) => {
    try {
      await fetch("/api/dashboard/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, customLayouts }),
      })
      setPreferences((prev) => ({ ...prev, customLayouts }))
    } catch (error) {
      console.error("Error saving custom layouts:", error)
    }
  }

  if (loading || !user || !data) {
    return (
      <DashboardLayout user={user || { name: "", email: "" }}>
        <div className="space-y-8">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  const widgets: Record<string, JSX.Element> = {
    stats: (
      <div key="stats" className="h-full">
        <DashboardStats stats={data.stats} />
      </div>
    ),
    tasks: (
      <div key="tasks" className="h-full">
        <TasksWidget />
      </div>
    ),
    "all-ships": (
      <div key="all-ships" className="h-full">
        <AllShipsWidget ships={data.ships} fleets={data.fleets} companies={data.companies} />
      </div>
    ),
    activity: (
      <div key="activity" className="h-full">
        <h2 className="text-2xl font-semibold mb-4">Son Aktiviteler</h2>
        <RecentActivity companies={data.companies} fixtures={data.fixtures.slice(0, 5)} />
      </div>
    ),
    financial: (
      <div key="financial" className="h-full">
        <h2 className="text-2xl font-semibold mb-4">Finansal Özet</h2>
        <div className="space-y-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-green-600">${data.stats.totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Gider</p>
                  <p className="text-2xl font-bold text-red-600">${data.stats.totalExpense.toLocaleString()}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className={`border-l-4 ${data.stats.netProfit >= 0 ? "border-l-blue-500" : "border-l-orange-500"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Kar/Zarar</p>
                  <p
                    className={`text-2xl font-bold ${data.stats.netProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}
                  >
                    ${data.stats.netProfit.toLocaleString()}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${data.stats.netProfit >= 0 ? "text-blue-600" : "text-orange-600"}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    companies: (
      <div key="companies" className="h-full">
        <h2 className="text-2xl font-semibold mb-4">Şirketlerim</h2>
        <CompanyList initialCompanies={data.companies} />
      </div>
    ),
    "upcoming-laycans": (
      <div key="upcoming-laycans" className="h-full">
        <UpcomingLaycansWidget fixtures={data.fixtures} />
      </div>
    ),
    "active-voyages": (
      <div key="active-voyages" className="h-full">
        <ActiveVoyagesWidget voyages={data.voyages} />
      </div>
    ),
    "pending-actions": (
      <div key="pending-actions" className="h-full">
        <PendingActionsWidget
          pendingInvoices={data.stats.pendingInvoices}
          upcomingLaycans={
            data.fixtures.filter((f: any) => {
              if (!f.laycan_start) return false
              const laycanDate = new Date(f.laycan_start)
              const now = new Date()
              const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
              return laycanDate >= now && laycanDate <= thirtyDaysFromNow
            }).length
          }
          expiringSoon={0}
        />
      </div>
    ),
    "recent-documents": (
      <div key="recent-documents" className="h-full">
        <RecentDocumentsWidget documents={[]} />
      </div>
    ),
    "fleet-performance": (
      <div key="fleet-performance" className="h-full">
        <FleetPerformanceWidget ships={data.ships} voyages={data.voyages} />
      </div>
    ),
    "fuel-cost": (
      <div key="fuel-cost" className="h-full">
        <FuelCostWidget />
      </div>
    ),
    "port-statistics": (
      <div key="port-statistics" className="h-full">
        <PortStatisticsWidget />
      </div>
    ),
    weather: (
      <div key="weather" className="h-full">
        <WeatherWidget />
      </div>
    ),
    "market-prices": (
      <div key="market-prices" className="h-full">
        <MarketPricesWidget />
      </div>
    ),
    "performance-comparison": (
      <div key="performance-comparison" className="h-full">
        <PerformanceComparisonWidget />
      </div>
    ),
    "financial-forecast": (
      <div key="financial-forecast" className="h-full">
        <FinancialForecastWidget />
      </div>
    ),
    compliance: (
      <div key="compliance" className="h-full">
        <ComplianceWidget />
      </div>
    ),
  }

  const organizeWidgets = () => {
    const customLayout = preferences.customLayouts.find((l) => l.id === preferences.layoutType)

    // Initialize organized object with all possible areas
    const organized: Record<string, JSX.Element[]> = {}

    if (customLayout) {
      // For custom layouts, create areas based on the layout definition
      customLayout.areas.forEach((area) => {
        organized[area.id] = []
      })
    } else {
      // For predefined layouts
      organized.sidebar = []
      organized.main = []
    }

    preferences.visibleWidgets
      .map((widgetId) => ({
        id: widgetId,
        widget: widgets[widgetId],
        position: preferences.widgetPositions[widgetId] || { area: "main", order: 0 },
      }))
      .sort((a, b) => a.position.order - b.position.order)
      .forEach(({ widget, position }) => {
        if (widget) {
          // Place widget in its assigned area, or fallback to first available area
          if (organized[position.area]) {
            organized[position.area].push(widget)
          } else {
            const firstArea = Object.keys(organized)[0]
            if (firstArea) {
              organized[firstArea].push(widget)
            }
          }
        }
      })

    return organized
  }

  const organizedWidgets = organizeWidgets()

  const renderLayout = () => {
    const customLayout = preferences.customLayouts.find((l) => l.id === preferences.layoutType)

    if (customLayout) {
      const getWidthClass = (width: string) => {
        const widthMap: Record<string, string> = {
          full: "col-span-12",
          "1/2": "col-span-6",
          "1/3": "col-span-4",
          "2/3": "col-span-8",
          "1/4": "col-span-3",
          "3/4": "col-span-9",
        }
        return widthMap[width] || "col-span-12"
      }

      return (
        <div className="grid grid-cols-12 gap-6">
          {customLayout.areas.map((area) => (
            <div key={area.id} className={getWidthClass(area.width)}>
              <div className="space-y-6">
                {organizedWidgets[area.id] && organizedWidgets[area.id].length > 0 ? (
                  organizedWidgets[area.id]
                ) : (
                  <Card className="p-6 border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                      Bu alana widget eklemek için "Widget Yönet" butonunu kullanın
                    </p>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    switch (preferences.layoutType) {
      case "sidebar-left":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <div className="space-y-6">{organizedWidgets.sidebar}</div>
            <div className="grid gap-6 md:grid-cols-2">{organizedWidgets.main}</div>
          </div>
        )
      case "sidebar-right":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="grid gap-6 md:grid-cols-2">{organizedWidgets.main}</div>
            <div className="space-y-6">{organizedWidgets.sidebar}</div>
          </div>
        )
      case "grid-3col":
        return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{organizedWidgets.main}</div>
      case "masonry":
        return <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">{organizedWidgets.main}</div>
      case "grid-2col":
      default:
        return <div className="grid gap-6 md:grid-cols-2">{organizedWidgets.main}</div>
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Gemi işletme yönetim sisteminize hoş geldiniz</p>
          </div>
          <div className="flex gap-2">
            <CustomLayoutBuilder customLayouts={preferences.customLayouts} onSave={handleCustomLayoutsChange} />
            <DashboardLayoutSelector
              currentLayout={preferences.layoutType}
              customLayouts={preferences.customLayouts}
              onLayoutChange={handleLayoutChange}
            />
            <DashboardWidgetManager
              layoutType={preferences.layoutType}
              customLayout={preferences.customLayouts.find((l) => l.id === preferences.layoutType) || null}
              visibleWidgets={preferences.visibleWidgets}
              widgetPositions={preferences.widgetPositions}
              onSave={handleWidgetChange}
            />
          </div>
        </div>

        {renderLayout()}
      </div>
    </DashboardLayout>
  )
}
