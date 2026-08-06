import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Excel'den toplu fatura aktarımı.
 *
 * Kritik düzeltme: Erişim kontrolü `team_members` adlı bir tabloyu
 * sorguluyordu; veritabanında böyle bir tablo yok (doğrusu
 * `company_team_members`). Bu yüzden sorgu her istekte hata veriyor ve
 * özellik hiç çalışmıyordu. Kontrol artık merkezî yetki katmanı üzerinden
 * yapılıyor.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { invoices, companyId } = await request.json()

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: "Fatura verisi gönderilmedi" }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: "Şirket seçilmelidir" }, { status: 400 })
    }

    await requireCompanyAccess(user.id, companyId, "canCreate")

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const invoice of invoices) {
      if (!invoice?.invoice_number) {
        results.failed++
        results.errors.push("Fatura numarası eksik")
        continue
      }

      try {
        await sql`
          INSERT INTO invoices (
            company_id, invoice_number, invoice_date, due_date,
            invoice_type, type, ship_name, charterer, amount, currency, status,
            broker_commission_rate, broker_commission, broker_commission_status,
            description, notes
          ) VALUES (
            ${companyId}, ${invoice.invoice_number}, ${invoice.invoice_date},
            ${invoice.due_date || null}, ${invoice.invoice_type}, ${invoice.type},
            ${invoice.ship_name || null}, ${invoice.charterer || null},
            ${invoice.amount}, ${invoice.currency}, ${invoice.status},
            ${invoice.broker_commission_rate || 0}, ${invoice.broker_commission || 0},
            ${invoice.broker_commission_status || "pending"},
            ${invoice.description || null}, ${invoice.notes || null}
          )
        `
        results.success++
      } catch (error) {
        console.error(`[Fatura aktarımı] "${invoice.invoice_number}" eklenemedi:`, error)
        results.failed++
        results.errors.push(`${invoice.invoice_number}: kayıt eklenemedi`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error, "Fatura aktarımı")
  }
}
