import { requireAuth } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AllShipsList } from "@/components/all-ships-list"
import { PageHeader } from "@/components/page-header"
import { ShipsDashboard } from "@/components/ships-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AllShipsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <PageHeader title="Tüm Gemiler" description="Filonuzdaki tüm gemileri görüntüleyin, filtreleyin ve yönetin" />

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="list">Gemi Listesi</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <ShipsDashboard />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <AllShipsList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
