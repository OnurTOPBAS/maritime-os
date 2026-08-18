import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CompanyList } from "@/components/company-list"
import { sql } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { getAccessibleCompanyIds, isSuperAdmin } from "@/lib/authz"

export const dynamic = "force-dynamic"

export default async function CompaniesPage() {
  const user = await requireAuth()

  await guardPage(user.id, "companies")
  // Erişim sınırı: kullanıcı yalnızca sahibi/üyesi olduğu şirketleri görür.
  // Süper yönetici hepsini. (Önceden tüm şirketler herkese listeleniyordu.)
  const superAdmin = await isSuperAdmin(user.id)
  let companies: any[] = []
  if (superAdmin) {
    companies = await sql`SELECT * FROM companies ORDER BY created_at DESC`
  } else {
    const ids = await getAccessibleCompanyIds(user.id)
    if (ids.length > 0) {
      companies = await sql`
        SELECT * FROM companies WHERE id = ANY(${ids}::uuid[]) ORDER BY created_at DESC
      `
    }
  }

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
