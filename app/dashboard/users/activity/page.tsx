import { DashboardLayout } from "@/components/dashboard-layout"
import { UserActivityDashboard } from "@/components/user-activity-dashboard"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function UserActivityPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <UserActivityDashboard />
      </div>
    </DashboardLayout>
  )
}
