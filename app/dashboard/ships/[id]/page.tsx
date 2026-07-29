import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ShipDetailView } from "@/components/ship-detail-view"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isValidUUID } from "@/lib/utils"

export default async function ShipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const { id } = await params

  if (!user) {
    redirect("/auth/signin")
  }

  if (!id || !isValidUUID(id)) {
    redirect("/dashboard/ships")
  }

  const ships = await sql`
    SELECT s.*, f.id as fleet_id, f.name as fleet_name, c.name as company_name
    FROM ships s
    JOIN fleets f ON s.fleet_id = f.id
    JOIN companies c ON f.company_id = c.id
    LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
    WHERE s.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
  `

  if (ships.length === 0) {
    redirect("/dashboard/ships")
  }

  const ship = ships[0]

  const fixtures = await sql`
    SELECT * FROM fixtures 
    WHERE ship_id = ${id}
    ORDER BY cp_date DESC NULLS LAST, created_at DESC
  `

  return (
    <DashboardLayout user={user}>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/fleets/${ship.fleet_id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {ship.fleet_name} Filosuna Dön
          </Link>
        </Button>
      </div>
      <ShipDetailView ship={ship} initialFixtures={fixtures} />
    </DashboardLayout>
  )
}
