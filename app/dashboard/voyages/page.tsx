import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VoyageList } from "@/components/voyage-list"
import { PageHeader } from "@/components/page-header"
import { VoyagesDashboard } from "@/components/voyages-dashboard"
import { VoyagesTimeline } from "@/components/voyages-timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function VoyagesPage() {
  const user = await requireAuth()

  await guardPage(user.id, "voyages")
  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <PageHeader title="Seferler" description="Tüm seferlerinizi takip edin, yönetin ve detaylarını görüntüleyin" />

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
            <TabsTrigger value="list">Sefer Listesi</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <VoyagesDashboard />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <VoyagesTimeline />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <VoyageList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
