import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds, requireShipAccess, requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const shipId = searchParams.get("shipId")
    const fixtureId = searchParams.get("fixtureId")
    const invoiceId = searchParams.get("invoiceId")
    const category = searchParams.get("category")

    // Belirli bir kayda ait belgeler isteniyorsa önce o kayda erişim doğrulanır.
    if (shipId) {
      await requireShipAccess(user.id, shipId, "canView")
    } else if (fixtureId) {
      const [row] = await sql`
        SELECT f.company_id FROM fixtures fx
        JOIN ships s ON fx.ship_id = s.id
        JOIN fleets f ON s.fleet_id = f.id
        WHERE fx.id = ${fixtureId}
      `
      if (!row) return NextResponse.json({ error: "Fixture bulunamadı" }, { status: 404 })
      await requireCompanyAccess(user.id, row.company_id, "canView")
    } else if (invoiceId) {
      const [row] = await sql`SELECT company_id FROM invoices WHERE id = ${invoiceId}`
      if (!row) return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 })
      await requireCompanyAccess(user.id, row.company_id, "canView")
    }

    // Filtresiz listede önceden TÜM şirketlerin belgeleri dönüyordu.
    // Artık yalnızca kullanıcının eriştiği şirketlerin belgeleri listelenir.
    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ documents: [] })
    }

    const documents = await sql`
      SELECT d.*, u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN ships s ON d.ship_id = s.id
      LEFT JOIN fleets fs ON s.fleet_id = fs.id
      LEFT JOIN fixtures fx ON d.fixture_id = fx.id
      LEFT JOIN ships s2 ON fx.ship_id = s2.id
      LEFT JOIN fleets ff ON s2.fleet_id = ff.id
      LEFT JOIN invoices i ON d.invoice_id = i.id
      WHERE COALESCE(fs.company_id, ff.company_id, i.company_id) = ANY(${allowedCompanyIds}::uuid[])
        AND (${shipId ?? null}::uuid IS NULL OR d.ship_id = ${shipId ?? null}::uuid)
        AND (${fixtureId ?? null}::uuid IS NULL OR d.fixture_id = ${fixtureId ?? null}::uuid)
        AND (${invoiceId ?? null}::uuid IS NULL OR d.invoice_id = ${invoiceId ?? null}::uuid)
        AND (${category ?? null}::text IS NULL OR d.category = ${category ?? null}::text)
      ORDER BY d.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ documents })
  } catch (error) {
    return handleApiError(error, "Belge listesi")
  }
}
