import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"
import { del } from "@vercel/blob"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string; documentId: string } }) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = params
    const data = await request.json()

    // Verify user has access to this document
    const documents = await sql`
      SELECT d.id
      FROM documents d
      JOIN voyages v ON d.voyage_id = v.id
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE d.id = ${documentId}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (documents.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Update document metadata
    const result = await sql`
      UPDATE documents
      SET 
        port = ${data.port},
        category = ${data.category},
        description = ${data.description},
        updated_at = NOW()
      WHERE id = ${documentId}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; documentId: string } }) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = params

    const documents = await sql`
      SELECT d.file_url
      FROM documents d
      JOIN voyages v ON d.voyage_id = v.id
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE d.id = ${documentId}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (documents.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from blob storage
    try {
      await del(documents[0].file_url)
    } catch (error) {
      console.error("Error deleting from blob storage:", error)
    }

    // Delete from database
    await sql`DELETE FROM documents WHERE id = ${documentId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
