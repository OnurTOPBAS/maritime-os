import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET() {
  try {
    const user = await requireAuth()

    const companies = await sql`
      SELECT DISTINCT c.* FROM companies c
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL
      ORDER BY c.created_at DESC
    `

    return NextResponse.json(companies)
  } catch (error) {
    console.error("[v0] Get companies error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { name, address, phone, email, tax_number } = await request.json()

    console.log("[v0] Creating company for user:", user.id)

    if (!name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const newCompanies = await sql`
      INSERT INTO companies (name, owner_id, address, phone, email, tax_number)
      VALUES (${name}, ${user.id}, ${address || null}, ${phone || null}, ${email || null}, ${tax_number || null})
      RETURNING *
    `

    return NextResponse.json(newCompanies[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Create company error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
