import { requireAuth } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CertificateReportsDashboard } from "@/components/certificate-reports-dashboard"

export default async function CertificateReportsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <div className="container mx-auto py-6">
        <CertificateReportsDashboard />
      </div>
    </DashboardLayout>
  )
}
