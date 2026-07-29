import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserManagement } from "@/components/user-management"
import { TeamManagement } from "@/components/team-management"
import { getUserCompanies } from "@/lib/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function UsersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const companies = await getUserCompanies(user.id)
  const defaultCompany = companies[0]

  if (!defaultCompany) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <p>Şirket bulunamadı. Lütfen önce bir şirket oluşturun.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">
            Şirket kullanıcılarını yönetin, yeni kullanıcı ekleyin ve davet gönderin.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="invitations">Davetler</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement companyId={defaultCompany.id} />
          </TabsContent>

          <TabsContent value="invitations">
            <TeamManagement companyId={defaultCompany.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
