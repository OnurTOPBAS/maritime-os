import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"
import { validateUpload } from "@/lib/upload-validation"
import { saveFile } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Dosya gönderilmedi" }, { status: 400 })
    }

    // Önceden yalnızca file.type.startsWith("image/") kontrol ediliyordu;
    // bu, image/svg+xml gibi betik çalıştırabilen türlere izin veriyordu.
    validateUpload(file, "signature")

    const saved = await saveFile("signatures", user.id, file)

    return NextResponse.json({ url: saved.url })
  } catch (error) {
    return handleApiError(error, "İmza yükleme")
  }
}
