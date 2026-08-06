import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { canAccessCompany } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { validateInvoice } from "@/lib/validation"

/**
 * Toplu fatura aktarımı (data-importer bileşeni tarafından kullanılır).
 *
 * Düzeltilen sorunlar:
 *  - validateInvoice() bir ValidationError DİZİSİ döndürür; kod ise
 *    `validation.valid` bekliyordu. Daima undefined olduğu için HER fatura
 *    doğrulamadan kalıyor ve aktarım hiç çalışmıyordu.
 *  - Erişim yalnızca şirket sahibine açıktı; ekip üyeleri aktarım yapamıyordu.
 *  - Yinelenen fatura kontrolü sahiplik üzerinden yapılıyordu; artık doğrudan
 *    ilgili şirket içinde kontrol edilir.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    const { invoices } = await request.json()

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: "Fatura verisi gönderilmedi" }, { status: 400 })
    }

    const results = { success: 0, failed: 0, errors: [] as any[] }

    const companyAccess = new Map<string, boolean>()

    for (const invoice of invoices) {
      try {
        const validationErrors = validateInvoice(invoice)
        if (validationErrors.length > 0) {
          results.failed++
          results.errors.push({
            row: invoice,
            error: validationErrors.map((e) => e.message).join(", "),
          })
          continue
        }

        if (!invoice.company_id) {
          results.failed++
          results.errors.push({ row: invoice, error: "Şirket belirtilmedi" })
          continue
        }

        let allowed = companyAccess.get(invoice.company_id)
        if (allowed === undefined) {
          allowed = await canAccessCompany(user.id, invoice.company_id, "canCreate")
          companyAccess.set(invoice.company_id, allowed)
        }

        if (!allowed) {
          results.failed++
          results.errors.push({ row: invoice, error: "Şirket bulunamadı veya erişim yetkiniz yok" })
          continue
        }

        const existing = await sql`
          SELECT id FROM invoices
          WHERE invoice_number = ${invoice.invoice_number} AND company_id = ${invoice.company_id}
        `

        if (existing.length > 0) {
          results.failed++
          results.errors.push({
            row: invoice,
            error: `Fatura numarası ${invoice.invoice_number} zaten kayıtlı`,
          })
          continue
        }

        await sql`
          INSERT INTO invoices (
            company_id, invoice_number, invoice_date, due_date, amount, type, status, description
          ) VALUES (
            ${invoice.company_id}, ${invoice.invoice_number}, ${invoice.invoice_date},
            ${invoice.due_date || null}, ${invoice.amount}, ${invoice.type},
            ${invoice.status || "pending"}, ${invoice.description || ""}
          )
        `

        results.success++
      } catch (error) {
        console.error(`[Fatura aktarımı] "${invoice?.invoice_number}" eklenemedi:`, error)
        results.failed++
        results.errors.push({ row: invoice, error: "Kayıt eklenemedi" })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error, "Fatura aktarımı")
  }
}
