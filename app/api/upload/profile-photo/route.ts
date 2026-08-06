import { saveFile } from "@/lib/storage"
import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"
import { validateUpload } from "@/lib/upload-validation"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Dosya gönderilmedi" }, { status: 400 })
    }

    validateUpload(file, "image")

    const saved = await saveFile("profile-photos", user.id, file)

    return NextResponse.json({ url: saved.url })
  } catch (error) {
    return handleApiError(error, "Profil fotoğrafı yükleme")
  }
}
