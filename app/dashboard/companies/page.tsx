import { requireAuth } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CompanyList } from "@/components/company-list"
import { sql } from "@/lib/db"
import { PageHeader } from "@/components/page-header"

export const dynamic = "force-dynamic"

export default async function CompaniesPage() {
  const user = await requireAuth()

  const companies = await sql`
    SELECT * FROM companies
    ORDER BY created_at DESC
  `

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <PageHeader
          title="Şirketler"
          description="Tüm şirketlerinizi görüntüleyin, yönetin ve yeni şirketler ekleyin"
        />
        <CompanyList initialCompanies={companies} />
      </div>
    </DashboardLayout>
  )
}
