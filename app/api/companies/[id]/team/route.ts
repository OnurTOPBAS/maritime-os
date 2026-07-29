import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = params.id

    // Get team members
    const teamMembers = await sql`
      SELECT 
        ctm.id,
        ctm.user_id,
        ctm.role,
        ctm.created_at,
        u.name,
        u.email,
        u.image,
        added_by_user.name as added_by_name
      FROM company_team_members ctm
      JOIN users u ON ctm.user_id = u.id
      LEFT JOIN users added_by_user ON ctm.added_by = added_by_user.id
      WHERE ctm.company_id = ${companyId}
      ORDER BY ctm.created_at DESC
    `

    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = params.id
    const { userId, role } = await request.json()

    // Get current user
    const [currentUser] = await sql`SELECT id FROM users WHERE email = ${session.email}`

    // Check if user is already a team member
    const [existing] = await sql`
      SELECT id FROM company_team_members 
      WHERE company_id = ${companyId} AND user_id = ${userId}
    `

    if (existing) {
      return NextResponse.json({ error: "User is already a team member" }, { status: 400 })
    }

    // Add team member
    const [teamMember] = await sql`
      INSERT INTO company_team_members (company_id, user_id, role, added_by)
      VALUES (${companyId}, ${userId}, ${role}, ${currentUser.id})
      RETURNING *
    `

    return NextResponse.json(teamMember)
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 })
  }
}
