import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { logActivity } from "@/lib/audit-logger"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fleetId = (await params).id

    // Get the original fleet with company ownership check
    const fleets = await sql`
      SELECT f.*, c.owner_id 
      FROM fleets f
      JOIN companies c ON f.company_id = c.id
      WHERE f.id = ${fleetId} AND c.owner_id = ${user.id}
    `

    if (fleets.length === 0) {
      return NextResponse.json({ error: "Fleet not found" }, { status: 404 })
    }

    const originalFleet = fleets[0]

    // Create a copy of the fleet
    const newFleets = await sql`
      INSERT INTO fleets (
        company_id, name, description
      ) VALUES (
        ${originalFleet.company_id},
        ${originalFleet.name + " (Kopya)"},
        ${originalFleet.description}
      )
      RETURNING *
    `

    const newFleet = newFleets[0]

    // Log the activity
    await logActivity({
      userId: user.id,
      entityType: "fleet",
      entityId: newFleet.id,
      action: "create",
      changes: { after: newFleet, note: `Copied from fleet ${fleetId}` },
    })

    return NextResponse.json(newFleet)
  } catch (error) {
    console.error("[v0] Copy fleet error:", error)
    return NextResponse.json({ error: "Failed to copy fleet" }, { status: 500 })
  }
}
