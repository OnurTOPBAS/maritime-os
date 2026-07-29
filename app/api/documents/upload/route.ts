import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Document upload API called")

    const user = await requireAuth()
    console.log("[v0] User authenticated:", user.id)

    const formData = await request.formData()

    const file = formData.get("file") as File
    const category = formData.get("category") as string
    const shipId = formData.get("shipId") as string | null
    const fixtureId = formData.get("fixtureId") as string | null
    const invoiceId = formData.get("invoiceId") as string | null
    const description = formData.get("description") as string | null

    console.log("[v0] Upload params:", { category, shipId, fixtureId, invoiceId, fileSize: file?.size })

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    // At least one relation must be set
    if (!shipId && !fixtureId && !invoiceId) {
      return NextResponse.json({ error: "Must specify ship, fixture, or invoice" }, { status: 400 })
    }

    console.log("[v0] Uploading to Blob storage...")
    const blob = await put(file.name, file, {
      access: "public",
    })
    console.log("[v0] Blob upload successful:", blob.url)

    console.log("[v0] Saving to database...")
    const result = await sql`
      INSERT INTO documents (
        filename, original_filename, file_url, file_size, file_type,
        category, ship_id, fixture_id, invoice_id, uploaded_by, description
      ) VALUES (
        ${file.name}, ${file.name}, ${blob.url}, ${file.size}, ${file.type},
        ${category}, ${shipId}, ${fixtureId}, ${invoiceId}, ${user.id}, ${description}
      )
      RETURNING *
    `
    console.log("[v0] Database save successful")

    return NextResponse.json({
      success: true,
      document: result[0],
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
