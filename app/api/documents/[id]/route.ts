import { deleteFile } from "@/lib/storage"
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCompanyAccess, resolveDocumentCompany, NotFoundError } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Belge silme.
 *
 * Önceden bu uç nokta yalnızca oturum olup olmadığına bakıyordu; kaydın
 * sahipliği hiç doğrulanmıyordu. Yani sisteme kayıtlı herhangi bir kullanıcı,
 * kimliğini bildiği HER belgeyi hem veritabanından hem depolamadan kalıcı
 * olarak silebiliyordu.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const docs = await sql`SELECT * FROM documents WHERE id = ${id}`
    if (docs.length === 0) {
      return NextResponse.json({ error: "Belge bulunamadı" }, { status: 404 })
    }
    const doc = docs[0]

    const companyId = await resolveDocumentCompany(id)
    if (!companyId) {
      throw new NotFoundError("Belge bulunamadı")
    }
    await requireCompanyAccess(user.id, companyId, "canDelete")

    // Önce veritabanı kaydı silinir. Depolama silme hatası tüm işlemi
    // bozmasın diye ayrıca ele alınır (kayıt gitti, dosya artık erişilemez).
    await sql`DELETE FROM documents WHERE id = ${id}`

    try {
      if (doc.file_url) await deleteFile(doc.file_url)
    } catch (blobError) {
      console.error("[Belge silme] Depolamadan silinemedi:", blobError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Belge silme")
  }
}
