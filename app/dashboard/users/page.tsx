import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UsersPageClient } from "@/components/users-page-client"
import { getUserCompanies } from "@/lib/permissions"

export default async function UsersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  await guardPage(user.id, "users")

  // Yalnızca kullanıcının erişebildiği şirketler (süper yönetici hepsini).
  const companies = await getUserCompanies(user.id)

  if (companies.length === 0) {
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
      <div className="p-6">
        <UsersPageClient companies={companies.map((c: any) => ({ id: c.id, name: c.name }))} />
      </div>
    </DashboardLayout>
  )
}
