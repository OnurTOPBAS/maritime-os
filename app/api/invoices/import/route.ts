import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const authResponse = await fetch(new URL("/api/auth/me", request.url), {
      headers: request.headers,
    })

    if (!authResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await authResponse.json()
    const userId = userData.user?.id

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const body = await request.json()
    const { invoices, companyId } = body

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: "No invoices provided" }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Verify user has access to the company
    const companyCheck = await sql`
      SELECT c.id, c.owner_id, tm.user_id as team_member_id
      FROM companies c
      LEFT JOIN team_members tm ON c.id = tm.company_id AND tm.user_id = ${userId}
      WHERE c.id = ${companyId}
      AND (c.owner_id = ${userId} OR tm.user_id = ${userId})
    `

    if (companyCheck.length === 0) {
      return NextResponse.json({ error: "Company not found or access denied" }, { status: 404 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Import invoices one by one
    for (const invoice of invoices) {
      try {
        await sql`
          INSERT INTO invoices (
            company_id,
            invoice_number,
            invoice_date,
            due_date,
            invoice_type,
            type,
            ship_name,
            charterer,
            amount,
            currency,
            status,
            broker_commission_rate,
            broker_commission,
            broker_commission_status,
            description,
            notes
          ) VALUES (
            ${companyId},
            ${invoice.invoice_number},
            ${invoice.invoice_date},
            ${invoice.due_date || null},
            ${invoice.invoice_type},
            ${invoice.type},
            ${invoice.ship_name || null},
            ${invoice.charterer || null},
            ${invoice.amount},
            ${invoice.currency},
            ${invoice.status},
            ${invoice.broker_commission_rate || 0},
            ${invoice.broker_commission || 0},
            ${invoice.broker_commission_status || "pending"},
            ${invoice.description || null},
            ${invoice.notes || null}
          )
        `
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${invoice.invoice_number}: ${error.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("[v0] Import invoices error:", error)
    return NextResponse.json({ error: error.message || "Failed to import invoices" }, { status: 500 })
  }
}
