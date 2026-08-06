import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Panel sayaçları.
 *
 * Önceden sorgular hiçbir sınır içermiyordu: COUNT(*) FROM ships gibi
 * ifadeler SİSTEMDEKİ TÜM şirketlerin gemi/sefer/fatura sayısını
 * döndürüyordu. Artık yalnızca kullanıcının eriştiği şirketler sayılır.
 */
export async function GET() {
  try {
    const user = await requireAuth()

    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ totalShips: 0, activeVoyages: 0, pendingInvoices: 0 })
    }

    const [shipsResult, voyagesResult, invoicesResult] = await Promise.all([
      sql`
        SELECT COUNT(*) as count FROM ships s
        JOIN fleets f ON s.fleet_id = f.id
        WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
      `,
      sql`
        SELECT COUNT(*) as count FROM voyages v
        JOIN fixtures fx ON v.fixture_id = fx.id
        JOIN ships s ON fx.ship_id = s.id
        JOIN fleets f ON s.fleet_id = f.id
        WHERE v.status = 'active'
          AND f.company_id = ANY(${allowedCompanyIds}::uuid[])
      `,
      sql`
        SELECT COUNT(*) as count FROM invoices
        WHERE status = 'pending'
          AND company_id = ANY(${allowedCompanyIds}::uuid[])
      `,
    ])

    return NextResponse.json({
      totalShips: Number(shipsResult[0]?.count || 0),
      activeVoyages: Number(voyagesResult[0]?.count || 0),
      pendingInvoices: Number(invoicesResult[0]?.count || 0),
    })
  } catch (error) {
    return handleApiError(error, "Panel sayaçları")
  }
}
