import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const companies = await sql`
      SELECT DISTINCT c.* FROM companies c
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE c.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
    `

    if (companies.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json({ company: companies[0] })
  } catch (error) {
    console.error("[v0] Get company error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { name, address, phone, email, tax_number } = await request.json()

    const updatedCompanies = await sql`
      UPDATE companies 
      SET 
        name = ${name},
        address = ${address || null},
        phone = ${phone || null},
        email = ${email || null},
        tax_number = ${tax_number || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND owner_id = ${user.id}
      RETURNING *
    `

    if (updatedCompanies.length === 0) {
      return NextResponse.json({ error: "Company not found or insufficient permissions" }, { status: 404 })
    }

    return NextResponse.json({ company: updatedCompanies[0] })
  } catch (error) {
    console.error("[v0] Update company error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const deletedCompanies = await sql`
      DELETE FROM companies 
      WHERE id = ${id} AND owner_id = ${user.id}
      RETURNING id
    `

    if (deletedCompanies.length === 0) {
      return NextResponse.json({ error: "Company not found or insufficient permissions" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete company error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
