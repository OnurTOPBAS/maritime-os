import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { del } from "@vercel/blob"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const { id } = params

    // Get attachment and check access
    const attachment = await sql`
      SELECT a.*, i.company_id
      FROM invoice_attachments a
      LEFT JOIN invoices i ON a.invoice_id = i.id
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE a.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (attachment.length === 0) {
      return NextResponse.json({ error: "Attachment not found or access denied" }, { status: 404 })
    }

    // Delete from Blob storage
    await del(attachment[0].file_url)

    // Delete from database
    await sql`DELETE FROM invoice_attachments WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
