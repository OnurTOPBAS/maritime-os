import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"
import { validateShip } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ships } = await request.json()

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    }

    for (const ship of ships) {
      try {
        // Validate ship data
        const validation = validateShip(ship)
        if (!validation.valid) {
          results.failed++
          results.errors.push({
            row: ship,
            error: validation.errors.join(", "),
          })
          continue
        }

        // Check if fleet exists
        const fleet = await sql`
          SELECT f.* FROM fleets f
          JOIN companies c ON f.company_id = c.id
          WHERE f.id = ${ship.fleet_id} AND c.owner_id = ${user.id}
        `

        if (fleet.length === 0) {
          results.failed++
          results.errors.push({
            row: ship,
            error: "Filo bulunamadı veya erişim yetkiniz yok",
          })
          continue
        }

        // Check for duplicate IMO
        const existing = await sql`
          SELECT s.* FROM ships s
          JOIN fleets f ON s.fleet_id = f.id
          JOIN companies c ON f.company_id = c.id
          WHERE s.imo_number = ${ship.imo_number} AND c.owner_id = ${user.id}
        `

        if (existing.length > 0) {
          results.failed++
          results.errors.push({
            row: ship,
            error: `IMO numarası ${ship.imo_number} zaten kayıtlı`,
          })
          continue
        }

        // Insert ship
        await sql`
          INSERT INTO ships (
            fleet_id, name, imo_number, flag, ship_type, dwt, built_year, status
          ) VALUES (
            ${ship.fleet_id}, ${ship.name}, ${ship.imo_number}, ${ship.flag},
            ${ship.ship_type}, ${ship.dwt}, ${ship.built_year}, ${ship.status || "active"}
          )
        `

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: ship,
          error: error instanceof Error ? error.message : "Bilinmeyen hata",
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error importing ships:", error)
    return NextResponse.json({ error: "Failed to import ships" }, { status: 500 })
  }
}
