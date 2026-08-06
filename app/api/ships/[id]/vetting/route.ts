import { type NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/utils"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const shipId = (await params).id

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    const inspections = await sql`
      SELECT 
        vi.*,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM vetting_observations WHERE inspection_id = vi.id) as observations_count
      FROM vetting_inspections vi
      LEFT JOIN users u ON vi.created_by = u.id
      WHERE vi.ship_id = ${shipId}
      ORDER BY vi.inspection_date DESC
    `

    return NextResponse.json(inspections)
  } catch (error) {
    console.error("[v0] Get vetting inspections error:", error)
    return NextResponse.json({ error: "Failed to get vetting inspections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const shipId = (await params).id

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const result = await sql`
      INSERT INTO vetting_inspections (
        ship_id, vetting_type, inspection_date, port, inspector_company,
        inspector_name, observations_count, score, status, report_url, notes, created_by
      )
      VALUES (
        ${shipId},
        ${body.vettingType},
        ${body.inspectionDate},
        ${body.port || null},
        ${body.inspectorCompany || null},
        ${body.inspectorName || null},
        ${body.observationsCount || 0},
        ${body.score || null},
        ${body.status || "completed"},
        ${body.reportUrl || null},
        ${body.notes || null},
        ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Create vetting inspection error:", error)
    return NextResponse.json({ error: "Failed to create vetting inspection" }, { status: 500 })
  }
}
