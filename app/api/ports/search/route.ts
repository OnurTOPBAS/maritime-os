import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ ports: [] })
    }

    console.log("[v0] Searching ports for:", query)

    try {
      // Search ports by name (case-insensitive, partial match)
      const ports = await sql`
        SELECT 
          id,
          port_name,
          country_iso,
          country_name,
          unlocode,
          port_type,
          lat,
          lon,
          area_global,
          area_local
        FROM ports
        WHERE LOWER(port_name) LIKE LOWER(${`%${query}%`})
           OR LOWER(unlocode) LIKE LOWER(${`%${query}%`})
        ORDER BY 
          CASE 
            WHEN LOWER(port_name) = LOWER(${query}) THEN 1
            WHEN LOWER(port_name) LIKE LOWER(${query + "%"}) THEN 2
            ELSE 3
          END,
          port_name
        LIMIT 20
      `

      console.log("[v0] Found ports:", ports.length)

      return NextResponse.json({ ports })
    } catch (dbError: any) {
      console.error("[v0] Database error:", dbError?.message || dbError)

      // If it's a rate limit error, return a specific error message
      if (dbError?.message?.includes("Too Many Requests") || dbError?.message?.includes("rate limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again.", ports: [] },
          { status: 429 },
        )
      }

      // For other database errors, return empty results to allow manual entry
      return NextResponse.json({ ports: [], error: "Database temporarily unavailable" })
    }
  } catch (error) {
    console.error("[v0] Port search error:", error)
    return NextResponse.json({ error: "Failed to search ports", ports: [] }, { status: 500 })
  }
}
