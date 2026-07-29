import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { hasCompanyAccess } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    console.log("[v0] Fetching fleets:", { userId: user.id, companyId })

    let targetCompanyId = companyId

    if (!targetCompanyId) {
      // Get user's company from users table or company ownership
      const userCompanies = await sql`
        SELECT c.id FROM companies c
        WHERE c.owner_id = ${user.id}
        UNION
        SELECT ctm.company_id as id FROM company_team_members ctm
        WHERE ctm.user_id = ${user.id}
        LIMIT 1
      `

      if (userCompanies.length === 0) {
        console.log("[v0] No company found for user:", user.id)
        return NextResponse.json({ fleets: [] })
      }

      targetCompanyId = userCompanies[0].id
      console.log("[v0] Auto-detected companyId:", targetCompanyId)
    }

    const hasAccess = await hasCompanyAccess(user.id, targetCompanyId)

    console.log("[v0] Fleet access check:", { userId: user.id, companyId: targetCompanyId, hasAccess })

    if (!hasAccess) {
      return NextResponse.json({ error: "Company not found or access denied" }, { status: 404 })
    }

    const fleets = await sql`
      SELECT * FROM fleets 
      WHERE company_id = ${targetCompanyId}
      ORDER BY created_at DESC
    `

    console.log("[v0] Fleets fetched:", { count: fleets.length })

    return NextResponse.json({ fleets })
  } catch (error) {
    console.error("[v0] Get fleets error:", error)
    return NextResponse.json({ error: "Failed to fetch fleets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { company_id, name, description } = await request.json()

    if (!company_id || !name) {
      return NextResponse.json({ error: "Company ID and name are required" }, { status: 400 })
    }

    const hasAccess = await hasCompanyAccess(user.id, company_id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const newFleets = await sql`
      INSERT INTO fleets (company_id, name, description)
      VALUES (${company_id}, ${name}, ${description || null})
      RETURNING *
    `

    return NextResponse.json({ fleet: newFleets[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create fleet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
