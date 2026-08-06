import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"
import { validateUpload } from "@/lib/upload-validation"
import { saveFile } from "@/lib/storage"

/**
 * Genel dosya yükleme uç noktası (gemi belgeleri, sertifika ekleri vb.).
 *
 * Önceden bu rota kimlik doğrulaması YAPMIYORDU: internetteki herkes
 * depolama alanına dosya yükleyebiliyordu. Ayrıca dosya türü/boyutu
 * yalnızca tarayıcıda kontrol ediliyordu.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Dosya gönderilmedi" }, { status: 400 })
    }

    // Sunucu tarafı doğrulama: istemci kontrolleri baypas edilebilir.
    validateUpload(file, "document")

    // Dosya sunucunun diskine yazılır (Vercel Blob yerine). Kullanıcıya özel
    // yol + rastgele ön ek ile ham dosya adıyla başkasının dosyası ezilemez.
    const saved = await saveFile("uploads", user.id, file)

    return NextResponse.json({
      url: saved.url,
      pathname: saved.key,
      filename: file.name,
      size: saved.size,
      type: saved.type,
    })
  } catch (error) {
    return handleApiError(error, "Dosya yükleme")
  }
}
