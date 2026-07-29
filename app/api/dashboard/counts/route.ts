import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET() {
  try {
    await requireAuth()

    const [shipsResult, voyagesResult, invoicesResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM ships`,
      sql`SELECT COUNT(*) as count FROM voyages WHERE status = 'active'`,
      sql`SELECT COUNT(*) as count FROM invoices WHERE status = 'pending'`,
    ])

    return NextResponse.json({
      totalShips: Number(shipsResult[0]?.count || 0),
      activeVoyages: Number(voyagesResult[0]?.count || 0),
      pendingInvoices: Number(invoicesResult[0]?.count || 0),
    })
  } catch (error) {
    console.error("Error fetching dashboard counts:", error)
    return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 })
  }
}
