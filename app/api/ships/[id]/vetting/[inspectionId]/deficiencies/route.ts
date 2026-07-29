import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { isValidUUID } from "@/lib/utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string; inspectionId: string } }) {
  try {
    const shipId = params.id
    const inspectionId = params.inspectionId

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

export async function POST(request: NextRequest, { params }: { params: { id: string; inspectionId: string } }) {
  try {
    const shipId = params.id
    const inspectionId = params.inspectionId

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    if (!isValidUUID(inspectionId)) {
      return NextResponse.json({ error: "Invalid inspection ID" }, { status: 400 })
    }

    const body = await request.json()

    console.log("[v0] Adding deficiency to inspection:", inspectionId, body)

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

    console.log("[v0] Deficiency added successfully:", result[0])

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Add deficiency error:", error)
    return NextResponse.json({ error: "Failed to add deficiency" }, { status: 500 })
  }
}
