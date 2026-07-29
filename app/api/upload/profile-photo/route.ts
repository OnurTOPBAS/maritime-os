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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    console.log("[v0] Uploading profile photo:", file.name, file.size, "for user:", user.id)

    // Upload to Vercel Blob
    const blob = await put(`profile-photos/${user.id}-${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    console.log("[v0] Profile photo uploaded successfully:", blob.url)

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading profile photo:", error)
    return NextResponse.json(
      { error: "Failed to upload photo: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
