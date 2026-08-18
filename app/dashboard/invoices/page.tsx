import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InvoiceList } from "@/components/invoice-list"
import { PageHeader } from "@/components/page-header"

export default async function InvoicesPage() {
  const user = await requireAuth()

  await guardPage(user.id, "invoices")
  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <PageHeader title="Faturalar" description="Gelir ve gider faturalarınızı görüntüleyin, yönetin ve raporlayın" />
        <InvoiceList />
      </div>
    </DashboardLayout>
  )
}
