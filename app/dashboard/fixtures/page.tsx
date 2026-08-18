import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FixtureList } from "@/components/fixture-list"
import { FixturesDashboard } from "@/components/fixtures-dashboard"
import { FixturesTimeline } from "@/components/fixtures-timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function FixturesPage() {
  const user = await requireAuth()

  await guardPage(user.id, "fixtures")
  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fixture'lar</h1>
          <p className="text-muted-foreground mt-2">Tüm fixture'larınızı görüntüleyin ve yönetin</p>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
            <TabsTrigger value="list">Fixture Listesi</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <FixturesDashboard />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <FixturesTimeline />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <FixtureList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
