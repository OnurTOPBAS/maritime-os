import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"
import { checkPermission } from "@/lib/permissions"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    const canDelete = await checkPermission(user.id, companyId, "canDelete")
    if (!canDelete) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    await sql`
      DELETE FROM user_invitations
      WHERE id = ${params.id} AND company_id = ${companyId}
    `

    return NextResponse.json({ message: "Invitation deleted successfully" })
  } catch (error) {
    console.error("Error deleting invitation:", error)
    return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 })
  }
}
