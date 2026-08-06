import { type NextRequest, NextResponse } from "next/server"
import { saveFile } from "@/lib/storage"
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


    try {
      const saved = await saveFile("tasks", user.id, file)

      return NextResponse.json({
        url: saved.url,
        name: file.name,
        size: saved.size,
        type: saved.type,
      })
    } catch (blobError) {
      console.error("[Görev eki] Yükleme hatası:", blobError)
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
