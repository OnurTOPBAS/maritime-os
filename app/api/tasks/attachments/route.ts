import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] File upload request received")

    const user = await getCurrentUser()
    if (!user) {
      console.log("[v0] Unauthorized file upload attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", { name: file.name, size: file.size, type: file.type })

    try {
      const blob = await put(`tasks/${user.id}/${Date.now()}-${file.name}`, file, {
        access: "public",
      })

      console.log("[v0] File uploaded successfully:", blob.url)

      return NextResponse.json({
        url: blob.url,
        name: file.name,
        size: file.size,
        type: file.type,
      })
    } catch (blobError) {
      console.error("[v0] Blob upload error:", blobError)
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
