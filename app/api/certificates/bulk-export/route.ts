import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import * as XLSX from "xlsx"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    const { certificateIds } = await request.json()

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return NextResponse.json({ error: "Sertifika seçilmedi" }, { status: 400 })
    }

    // Erişilebilir şirketler ile sınırlanır: istenen kimlikler arasında
    // başka şirkete ait sertifika varsa sorgu onları getirmez.
    const allowedCompanyIds = await getAccessibleCompanyIds(user.id)
    if (allowedCompanyIds.length === 0) {
      return NextResponse.json({ error: "Erişilebilir sertifika yok" }, { status: 403 })
    }

    const certificates = await sql`
      SELECT
        s.name as ship_name,
        sc.certificate_name,
        sc.certificate_type,
        sc.certificate_number,
        sc.issued_date,
        sc.last_annual_date,
        sc.last_intermediate_date,
        sc.expires_date,
        sc.issuing_authority,
        sc.status,
        sc.notes
      FROM ship_certificates sc
      JOIN ships s ON sc.ship_id = s.id
      JOIN fleets f ON s.fleet_id = f.id
      WHERE f.company_id = ANY(${allowedCompanyIds}::uuid[])
        AND sc.id = ANY(${certificateIds}::uuid[])
      ORDER BY s.name, sc.certificate_name
    `

    const worksheetData = certificates.map((cert: any) => ({
      "Gemi Adı": cert.ship_name,
      "Sertifika Adı": cert.certificate_name,
      Tip: cert.certificate_type,
      "Sertifika No": cert.certificate_number || "",
      "Verilme Tarihi": cert.issued_date ? new Date(cert.issued_date).toLocaleDateString("tr-TR") : "",
      "Son Yıllık Muayene": cert.last_annual_date ? new Date(cert.last_annual_date).toLocaleDateString("tr-TR") : "",
      "Son Ara Muayene": cert.last_intermediate_date
        ? new Date(cert.last_intermediate_date).toLocaleDateString("tr-TR")
        : "",
      "Son Kullanma Tarihi": cert.expires_date ? new Date(cert.expires_date).toLocaleDateString("tr-TR") : "",
      "Veren Kurum": cert.issuing_authority || "",
      Durum: cert.status,
      Notlar: cert.notes || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sertifikalar")

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=certificates-${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    })
  } catch (error) {
    return handleApiError(error, "Sertifika dışa aktarma")
  }
}
