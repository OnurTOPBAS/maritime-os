import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"
import { validateInvoice } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoices } = await request.json()

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    }

    for (const invoice of invoices) {
      try {
        // Validate invoice data
        const validation = validateInvoice(invoice)
        if (!validation.valid) {
          results.failed++
          results.errors.push({
            row: invoice,
            error: validation.errors.join(", "),
          })
          continue
        }

        // Check if company exists
        const company = await sql`
          SELECT * FROM companies
          WHERE id = ${invoice.company_id} AND owner_id = ${user.id}
        `

        if (company.length === 0) {
          results.failed++
          results.errors.push({
            row: invoice,
            error: "Şirket bulunamadı veya erişim yetkiniz yok",
          })
          continue
        }

        // Check for duplicate invoice number
        const existing = await sql`
          SELECT i.* FROM invoices i
          JOIN companies c ON i.company_id = c.id
          WHERE i.invoice_number = ${invoice.invoice_number} AND c.owner_id = ${user.id}
        `

        if (existing.length > 0) {
          results.failed++
          results.errors.push({
            row: invoice,
            error: `Fatura numarası ${invoice.invoice_number} zaten kayıtlı`,
          })
          continue
        }

        // Insert invoice
        await sql`
          INSERT INTO invoices (
            company_id, invoice_number, invoice_date, due_date, amount, type, status, description
          ) VALUES (
            ${invoice.company_id}, ${invoice.invoice_number}, ${invoice.invoice_date},
            ${invoice.due_date}, ${invoice.amount}, ${invoice.type}, ${invoice.status || "pending"},
            ${invoice.description || ""}
          )
        `

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: invoice,
          error: error instanceof Error ? error.message : "Bilinmeyen hata",
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error importing invoices:", error)
    return NextResponse.json({ error: "Failed to import invoices" }, { status: 500 })
  }
}
