import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FleetDetailView } from "@/components/fleet-detail-view"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function FleetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const { id } = await params

  if (!user) {
    redirect("/auth/signin")
  }

  // Get fleet with company info - allow both owner and team members
  const fleets = await sql`
    SELECT f.*, c.id as company_id, c.name as company_name
    FROM fleets f
    JOIN companies c ON f.company_id = c.id
    LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
    WHERE f.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
  `

  if (fleets.length === 0) {
    redirect("/dashboard")
  }

  const fleet = fleets[0]

  const ships = await sql`
    SELECT * FROM ships 
    WHERE fleet_id = ${id}
    ORDER BY created_at DESC
  `

  return (
    <DashboardLayout user={user}>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/companies/${fleet.company_id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fleet.company_name} Şirketine Dön
          </Link>
        </Button>
      </div>
      <FleetDetailView fleet={fleet} initialShips={ships} />
    </DashboardLayout>
  )
}
