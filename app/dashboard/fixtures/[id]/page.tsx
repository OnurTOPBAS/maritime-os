import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FixtureDetailView } from "@/components/fixture-detail-view"
import { sql } from "@/lib/db"


export default async function FixturePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  await guardPage(user.id, "fixtures")
  if (!user) redirect("/auth/signin")

  const fixtures = await sql`
    SELECT 
      f.*,
      s.name as ship_name,
      s.imo_number,
      fl.name as fleet_name,
      c.name as company_name
    FROM fixtures f
    JOIN ships s ON f.ship_id = s.id
    JOIN fleets fl ON s.fleet_id = fl.id
    JOIN companies c ON fl.company_id = c.id
    LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
    WHERE f.id = ${(await params).id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
  `

  if (fixtures.length === 0) {
    redirect("/dashboard")
  }

  const voyages = await sql`
    SELECT * FROM voyages 
    WHERE fixture_id = ${(await params).id}
    ORDER BY created_at DESC
  `

  return (
    <DashboardLayout user={user}>
      <FixtureDetailView fixture={fixtures[0]} initialVoyages={voyages} />
    </DashboardLayout>
  )
}
