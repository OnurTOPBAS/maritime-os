import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching team members for messaging...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("[v0] No user found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Current user:", user.id, user.email)

    const ownedCompanies = await sql`
      SELECT id as company_id 
      FROM companies 
      WHERE owner_id = ${user.id}
      LIMIT 1
    `

    let companyId = null

    if (ownedCompanies.length > 0) {
      companyId = ownedCompanies[0].company_id
      console.log("[v0] User is company owner, company ID:", companyId)
    } else {
      const userCompany = await sql`
        SELECT company_id 
        FROM company_team_members 
        WHERE user_id = ${user.id}
        LIMIT 1
      `

      if (userCompany.length === 0) {
        console.log("[v0] User not associated with any company")
        return NextResponse.json({ users: [] })
      }

      companyId = userCompany[0].company_id
      console.log("[v0] User's company ID from team members:", companyId)
    }

    if (!companyId) {
      console.log("[v0] No valid company ID found")
      return NextResponse.json({ users: [] })
    }

    const teamMembers = await sql`
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        COALESCE(ctm.role, 'owner') as role,
        COALESCE(us.status, 'offline') as status
      FROM users u
      LEFT JOIN company_team_members ctm ON u.id = ctm.user_id AND ctm.company_id = ${companyId}
      LEFT JOIN user_status us ON u.id = us.user_id
      WHERE (
        u.id IN (SELECT owner_id FROM companies WHERE id = ${companyId})
        OR ctm.company_id = ${companyId}
      )
      AND u.id != ${user.id}
      ORDER BY u.name
    `

    console.log("[v0] Found team members:", teamMembers.length)

    return NextResponse.json({ users: teamMembers })
  } catch (error: any) {
    console.error("[v0] Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}
