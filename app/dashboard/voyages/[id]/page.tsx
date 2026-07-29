import { redirect } from "next/navigation"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VoyageDetailView } from "@/components/voyage-detail-view"

const sql = neon(process.env.DATABASE_URL!)

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export default async function VoyagePage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (!user) redirect("/auth/signin")

  if (!isValidUUID(params.id)) {
    redirect("/dashboard/voyages")
  }

  const voyages = await sql`
    SELECT 
      v.*,
      f.charterer,
      f.laycan_from,
      f.laycan_to,
      f.rate as freight_rate,
      f.rate_type as freight_rate_type,
      s.name as ship_name,
      s.imo_number,
      fl.name as fleet_name,
      c.name as company_name
    FROM voyages v
    JOIN fixtures f ON v.fixture_id = f.id
    JOIN ships s ON f.ship_id = s.id
    JOIN fleets fl ON s.fleet_id = fl.id
    JOIN companies c ON fl.company_id = c.id
    LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
    WHERE v.id = ${params.id} 
    AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
  `

  if (voyages.length === 0) {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout user={user}>
      <VoyageDetailView voyage={voyages[0]} />
    </DashboardLayout>
  )
}
