import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)

    const shipId = searchParams.get("shipId")
    const fixtureId = searchParams.get("fixtureId")
    const invoiceId = searchParams.get("invoiceId")
    const category = searchParams.get("category")

    let documents

    if (shipId) {
      documents = await sql`
        SELECT d.*, u.name as uploaded_by_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.ship_id = ${shipId}
        ${category ? sql`AND d.category = ${category}` : sql``}
        ORDER BY d.created_at DESC
      `
    } else if (fixtureId) {
      documents = await sql`
        SELECT d.*, u.name as uploaded_by_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.fixture_id = ${fixtureId}
        ${category ? sql`AND d.category = ${category}` : sql``}
        ORDER BY d.created_at DESC
      `
    } else if (invoiceId) {
      documents = await sql`
        SELECT d.*, u.name as uploaded_by_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.invoice_id = ${invoiceId}
        ${category ? sql`AND d.category = ${category}` : sql``}
        ORDER BY d.created_at DESC
      `
    } else {
      documents = await sql`
        SELECT d.*, u.name as uploaded_by_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        ORDER BY d.created_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
