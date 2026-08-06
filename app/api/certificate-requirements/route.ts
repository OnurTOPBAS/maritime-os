import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"


export async function GET(request: NextRequest) {
  try {
    // Referans verisi olsa da oturum aranır; herkese açık kalmamalı.
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const vesselType = searchParams.get("vesselType")

    let query
    if (vesselType) {
      query = sql`
        SELECT *
        FROM certificate_requirements
        WHERE vessel_type = ${vesselType}
        ORDER BY is_mandatory DESC, certificate_name ASC
      `
    } else {
      query = sql`
        SELECT DISTINCT vessel_type
        FROM certificate_requirements
        ORDER BY vessel_type ASC
      `
    }

    const result = await query
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, "Sertifika gereklilikleri")
  }
}
