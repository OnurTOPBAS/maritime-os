import { requireAuth } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ActivityLogs } from "@/components/activity-logs"
import { UserActivityTracker } from "@/components/user-activity-tracker"
import { getUserCompanies } from "@/lib/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ActivityPage() {
  const user = await requireAuth()
  const companies = await getUserCompanies(user.id)
  const defaultCompany = companies[0]

  return (
    <DashboardLayout user={user}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Aktivite Geçmişi</h1>
          <p className="text-muted-foreground">
            Sistemdeki tüm değişiklikleri ve kullanıcı aktivitelerini görüntüleyin
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Tüm Aktiviteler</TabsTrigger>
            <TabsTrigger value="users">Kullanıcı Bazlı</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ActivityLogs limit={100} />
          </TabsContent>

          <TabsContent value="users">
            {defaultCompany ? <UserActivityTracker companyId={defaultCompany.id} /> : <p>Şirket bulunamadı</p>}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
