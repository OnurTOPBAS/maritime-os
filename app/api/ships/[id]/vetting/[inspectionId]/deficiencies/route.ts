import { type NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/utils"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireShipAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; inspectionId: string }> }) {
  try {
    const user = await requireAuth()
    const { id: shipId, inspectionId } = await params
    await requireShipAccess(user.id, shipId, "canView")

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    if (!isValidUUID(inspectionId)) {
      return NextResponse.json({ error: "Invalid inspection ID" }, { status: 400 })
    }

    const observations = await sql`
      SELECT * FROM vetting_observations
      WHERE inspection_id = ${inspectionId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(observations)
  } catch (error) {
    console.error("[v0] Fetch observations error:", error)
    return NextResponse.json({ error: "Failed to fetch observations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; inspectionId: string }> }) {
  try {
    const user = await requireAuth()
    const { id: shipId, inspectionId } = await params
    await requireShipAccess(user.id, shipId, "canCreate")

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    if (!isValidUUID(inspectionId)) {
      return NextResponse.json({ error: "Invalid inspection ID" }, { status: 400 })
    }

    const body = await request.json()


    // Add the deficiency/observation
    const result = await sql`
      INSERT INTO vetting_observations (
        inspection_id, category, observation, action_taken
      )
      VALUES (
        ${inspectionId},
        ${body.category},
        ${body.observation},
        ${body.actionTaken || null}
      )
      RETURNING *
    `

    // Update the observations count
    await sql`
      UPDATE vetting_inspections
      SET observations_count = (
        SELECT COUNT(*) FROM vetting_observations WHERE inspection_id = ${inspectionId}
      )
      WHERE id = ${inspectionId}
    `


    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Add deficiency error:", error)
    return NextResponse.json({ error: "Failed to add deficiency" }, { status: 500 })
  }
}
