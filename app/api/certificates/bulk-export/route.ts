import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import * as XLSX from "xlsx"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certificateIds } = await request.json()

    if (!certificateIds || certificateIds.length === 0) {
      return NextResponse.json({ error: "No certificates selected" }, { status: 400 })
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
      WHERE f.company_id = ${session.user.companyId}
        AND sc.id = ANY(${certificateIds})
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
    console.error("[v0] Error bulk exporting certificates:", error)
    return NextResponse.json({ error: "Failed to export certificates" }, { status: 500 })
  }
}
