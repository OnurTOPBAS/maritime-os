import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const session = await getSession()
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { memberId } = params

    await sql`DELETE FROM company_team_members WHERE id = ${memberId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const session = await getSession()
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { memberId } = params
    const { role } = await request.json()

    const [updated] = await sql`
      UPDATE company_team_members 
      SET role = ${role}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
      RETURNING *
    `

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
  }
}
