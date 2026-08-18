import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/session"
import { requireAnyModuleAccess, ForbiddenError } from "@/lib/authz"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { OfficePnlPageClient } from "@/components/office-pnl-page-client"

export default async function OfficePnlPage() {
  const user = await requireAuth()

  // Office PnL yalnızca finance.view iznine sahip roller içindir. Menüde gizli
  // olsa da URL elle yazılabildiği için sunucu tarafında da kapatılır.
  try {
    await requireAnyModuleAccess(user.id, "finance", "view")
  } catch (e) {
    if (e instanceof ForbiddenError) redirect("/dashboard")
    throw e
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <PageHeader
          title="Office PnL"
          description="Ofis gelir ve giderlerini aylık olarak takip edin ve yönetin"
        />
        <OfficePnlPageClient />
      </div>
    </DashboardLayout>
  )
}
