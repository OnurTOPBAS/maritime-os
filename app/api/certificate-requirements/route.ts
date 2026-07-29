import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
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
    console.error("[v0] Get certificate requirements error:", error)
    return NextResponse.json({ error: "Failed to get certificate requirements" }, { status: 500 })
  }
}
