import { DashboardLayout } from "@/components/dashboard-layout"
import { AdvancedPermissionManager } from "@/components/advanced-permission-manager"
import { getCurrentUser } from "@/lib/session"
import { guardAdminPage } from "@/lib/page-guard"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdvancedPermissionsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }

  await guardAdminPage(user.id)

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <AdvancedPermissionManager />
      </div>
    </DashboardLayout>
  )
}
