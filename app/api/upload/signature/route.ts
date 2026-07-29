import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 2MB" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    console.log("[v0] Uploading signature:", file.name, file.size, "for user:", user.id)

    // Upload to Vercel Blob
    const blob = await put(`signatures/${user.id}-${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    console.log("[v0] Signature uploaded successfully:", blob.url)

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading signature:", error)
    return NextResponse.json(
      { error: "Failed to upload signature: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
