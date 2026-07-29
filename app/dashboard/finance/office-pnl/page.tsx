import { requireAuth } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { OfficePnlPageClient } from "@/components/office-pnl-page-client"

export default async function OfficePnlPage() {
  const user = await requireAuth()

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
