import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const file = formData.get("file") as File
    const invoiceId = formData.get("invoiceId") as string

    if (!file || !invoiceId) {
      return NextResponse.json({ error: "File and invoice ID required" }, { status: 400 })
    }

    // Check if user has access to the invoice's company
    const invoice = await sql`
      SELECT i.id, i.company_id
      FROM invoices i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE i.id = ${invoiceId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (invoice.length === 0) {
      return NextResponse.json({ error: "Invoice not found or access denied" }, { status: 404 })
    }

    // Upload to Vercel Blob
    const blob = await put(`invoices/${invoiceId}/${file.name}`, file, {
      access: "public",
    })

    // Save attachment record
    const result = await sql`
      INSERT INTO invoice_attachments (invoice_id, file_name, file_url, file_size, file_type, uploaded_by)
      VALUES (${invoiceId}, ${file.name}, ${blob.url}, ${file.size}, ${file.type}, ${user.id})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error uploading attachment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoiceId")

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID required" }, { status: 400 })
    }

    // Check access
    const invoice = await sql`
      SELECT i.id
      FROM invoices i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE i.id = ${invoiceId} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (invoice.length === 0) {
      return NextResponse.json({ error: "Invoice not found or access denied" }, { status: 404 })
    }

    const attachments = await sql`
      SELECT a.*, u.name as uploaded_by_name
      FROM invoice_attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.invoice_id = ${invoiceId}
      ORDER BY a.created_at DESC
    `

    return NextResponse.json(attachments)
  } catch (error: any) {
    console.error("Error fetching attachments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
