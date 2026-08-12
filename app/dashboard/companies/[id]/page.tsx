import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CompanyDetailView } from "@/components/company-detail-view"
import { isSuperAdmin } from "@/lib/authz"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const { id } = await params

  if (!user) {
    redirect("/auth/signin")
  }

  const superAdmin = await isSuperAdmin(user.id)
  const companies = superAdmin
    ? await sql`SELECT c.* FROM companies c WHERE c.id = ${id}`
    : await sql`
        SELECT c.*
        FROM companies c
        LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
        WHERE c.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
      `

  if (companies.length === 0) {
    redirect("/dashboard")
  }

  const company = companies[0]

  const fleets = await sql`
    SELECT * FROM fleets 
    WHERE company_id = ${id}
    ORDER BY created_at DESC
  `

  return (
    <DashboardLayout user={user}>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Şirketlere Dön
          </Link>
        </Button>
      </div>
      <CompanyDetailView company={company} initialFleets={fleets} />
    </DashboardLayout>
  )
}
