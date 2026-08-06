import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    // Get all users who are NOT already team members of this company
    const availableUsers = await sql`
      SELECT u.id, u.name, u.email, u.image, u.role
      FROM users u
      WHERE u.id NOT IN (
        SELECT user_id FROM company_team_members WHERE company_id = ${companyId}
      )
      AND u.id NOT IN (
        SELECT owner_id FROM companies WHERE id = ${companyId}
      )
      ORDER BY u.name
    `

    return NextResponse.json(availableUsers)
  } catch (error) {
    console.error("Error fetching available users:", error)
    return NextResponse.json({ error: "Failed to fetch available users" }, { status: 500 })
  }
}
