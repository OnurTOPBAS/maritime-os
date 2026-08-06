import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { validateUpload } from "@/lib/upload-validation"
import { saveFile } from "@/lib/storage"

/**
 * Belgenin iliştirileceği kaydın hangi şirkete ait olduğunu bulur.
 *
 * Bu olmadan kullanıcı, başkasına ait bir gemi/fixture/fatura kimliği
 * göndererek o kaydın altına belge iliştirebilirdi (IDOR).
 */
async function resolveCompanyId(
  shipId: string | null,
  fixtureId: string | null,
  invoiceId: string | null,
): Promise<string | null> {
  if (shipId) {
    const [row] = await sql`
      SELECT f.company_id FROM ships s
      JOIN fleets f ON s.fleet_id = f.id
      WHERE s.id = ${shipId}
    `
    return row?.company_id ?? null
  }

  if (fixtureId) {
    const [row] = await sql`
      SELECT f.company_id FROM fixtures fx
      JOIN ships s ON fx.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE fx.id = ${fixtureId}
    `
    return row?.company_id ?? null
  }

  if (invoiceId) {
    // invoices tablosu şirkete doğrudan bağlıdır (company_id sütunu var).
    const [row] = await sql`
      SELECT company_id FROM invoices WHERE id = ${invoiceId}
    `
    return row?.company_id ?? null
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()

    const file = formData.get("file") as File | null
    const category = formData.get("category") as string | null
    const shipId = (formData.get("shipId") as string | null) || null
    const fixtureId = (formData.get("fixtureId") as string | null) || null
    const invoiceId = (formData.get("invoiceId") as string | null) || null
    const description = (formData.get("description") as string | null) || null

    if (!file) {
      return NextResponse.json({ error: "Dosya gönderilmedi" }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: "Kategori zorunludur" }, { status: 400 })
    }

    if (!shipId && !fixtureId && !invoiceId) {
      return NextResponse.json({ error: "Gemi, fixture veya fatura belirtilmelidir" }, { status: 400 })
    }

    validateUpload(file, "document")

    // İlgili kaydın şirketi bulunur ve kullanıcının o şirkette yazma
    // yetkisi olduğu doğrulanır.
    const companyId = await resolveCompanyId(shipId, fixtureId, invoiceId)
    if (!companyId) {
      return NextResponse.json({ error: "İlgili kayıt bulunamadı" }, { status: 404 })
    }
    await requireCompanyAccess(user.id, companyId, "canCreate")

    const saved = await saveFile("documents", user.id, file)

    const result = await sql`
      INSERT INTO documents (
        filename, original_filename, file_url, file_size, file_type,
        category, ship_id, fixture_id, invoice_id, uploaded_by, description
      ) VALUES (
        ${saved.key}, ${file.name}, ${saved.url}, ${saved.size}, ${saved.type},
        ${category}, ${shipId}, ${fixtureId}, ${invoiceId}, ${user.id}, ${description}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, document: result[0] }, { status: 201 })
  } catch (error) {
    // Not: Önceden hata yanıtında error.stack istemciye gönderiliyordu
    // (bilgi sızıntısı). handleApiError yalnızca sunucuya loglar.
    return handleApiError(error, "Belge yükleme")
  }
}
