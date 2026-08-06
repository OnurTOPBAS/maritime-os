import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"
import { readFileBuffer } from "@/lib/storage"
import { sql } from "@/lib/db"
import { canAccessCompany, resolveDocumentCompany } from "@/lib/authz"

/**
 * Yüklenen dosyaları sunar.
 *
 * Dosyalar diskte public klasörünün dışında durur; buraya yalnızca kimlik
 * doğrulamalı istekler erişebilir. Böylece eski Vercel Blob davranışının
 * aksine (URL'i olan herkes açabiliyordu) dosyalar internete açık değildir.
 *
 * Belge (documents) klasöründeki dosyalar ayrıca şirket bazında sınırlanır:
 * kullanıcı, dosyanın bağlı olduğu şirkete erişemiyorsa dosyayı göremez.
 * İmza ve profil fotoğrafları ekip içinde paylaşıldığı için oturum yeterlidir.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const user = await requireAuth()
    const { key: parts } = await params
    const key = parts.map((p) => decodeURIComponent(p)).join("/")

    // Belge dosyalarında şirket erişimi doğrulanır.
    if (key.startsWith("documents/")) {
      const url = `/api/files/${parts.join("/")}`
      const [doc] = await sql`
        SELECT id FROM documents WHERE file_url = ${url}
      `
      if (doc) {
        const companyId = await resolveDocumentCompany(doc.id)
        if (companyId && !(await canAccessCompany(user.id, companyId, "canView"))) {
          return NextResponse.json({ error: "Bu dosyaya erişiminiz yok" }, { status: 403 })
        }
      }
    }

    const file = await readFileBuffer(key)
    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.type,
        // Tarayıcıda görüntülensin; internete açık değil (özel önbellek).
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    return handleApiError(error, "Dosya sunma")
  }
}
