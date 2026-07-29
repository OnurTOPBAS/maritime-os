import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const { id } = params

    // Get document info
    const docs = await sql`
      SELECT * FROM documents WHERE id = ${id}
    `

    if (docs.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const doc = docs[0]

    // Delete from Blob storage
    await del(doc.file_url)

    // Delete from database
    await sql`
      DELETE FROM documents WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
