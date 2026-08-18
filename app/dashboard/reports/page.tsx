import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ShipFinancialReport } from "@/components/ship-financial-report"
import { MonthlyFinancialChart } from "@/components/monthly-financial-chart"
import { FleetUtilizationChart } from "@/components/fleet-utilization-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CertificateReportsDashboard } from "@/components/certificate-reports-dashboard"

export default async function ReportsPage() {
  const user = await requireAuth()

  await guardPage(user.id, "reports")
  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Raporlar ve Analizler</h1>
          <p className="text-muted-foreground">Detaylı finansal raporlar, grafikler ve performans analizleri</p>
        </div>

        <Tabs defaultValue="financials" className="space-y-6">
          <TabsList>
            <TabsTrigger value="financials">Finansal Analiz</TabsTrigger>
            <TabsTrigger value="fleet">Filo Kullanımı</TabsTrigger>
            <TabsTrigger value="ships">Gemi Bazlı</TabsTrigger>
            <TabsTrigger value="certificates">Sertifikalar</TabsTrigger>
          </TabsList>

          <TabsContent value="financials" className="space-y-6">
            <MonthlyFinancialChart />
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <FleetUtilizationChart />
          </TabsContent>

          <TabsContent value="ships" className="space-y-6">
            <ShipFinancialReport />
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <CertificateReportsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
