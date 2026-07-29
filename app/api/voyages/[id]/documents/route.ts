import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const voyageId = params.id

    const documents = await sql`
      SELECT 
        d.*
      FROM documents d
      JOIN voyages v ON d.voyage_id = v.id
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE d.voyage_id = ${voyageId}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
      ORDER BY d.created_at DESC
    `

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const voyageId = params.id
    const body = await request.json()

    const result = await sql`
      INSERT INTO documents (
        voyage_id,
        filename,
        original_filename,
        file_url,
        file_type,
        file_size,
        category,
        port,
        description,
        uploaded_by
      ) VALUES (
        ${voyageId},
        ${body.filename},
        ${body.original_filename},
        ${body.file_url},
        ${body.file_type},
        ${body.file_size},
        ${body.category},
        ${body.port || null},
        ${body.description || null},
        ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
