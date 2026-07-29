import { DashboardLayout } from "@/components/dashboard-layout"
import { CertificateReportsDashboard } from "@/components/certificate-reports-dashboard"

export default function CertificateReportsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <CertificateReportsDashboard />
      </div>
    </DashboardLayout>
  )
}
