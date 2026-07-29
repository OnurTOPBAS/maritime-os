import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"
import { checkPermission } from "@/lib/permissions"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, role, companyId, password } = body

    const canEdit = await checkPermission(user.id, companyId, "canEdit")
    if (!canEdit) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (email) {
      const currentUser = await sql`
        SELECT email FROM users WHERE id = ${params.id}
      `

      if (currentUser[0]?.email !== email) {
        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${email} AND id != ${params.id}
        `

        if (existingUser.length > 0) {
          return NextResponse.json({ error: "Bu email adresi zaten kullanılıyor" }, { status: 400 })
        }
      }
    }

    if (name || email) {
      await sql`
        UPDATE users
        SET 
          name = COALESCE(${name}, name),
          email = COALESCE(${email}, email),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${params.id}
      `
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10)
      await sql`
        UPDATE users
        SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${params.id}
      `
    }

    if (role !== undefined) {
      await sql`
        UPDATE user_permissions
        SET 
          role = ${role},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${params.id} AND company_id = ${companyId}
      `
    }

    const updatedUser = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        up.role as permission_role
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id AND up.company_id = ${companyId}
      WHERE u.id = ${params.id}
    `

    return NextResponse.json(updatedUser[0])
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

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

    const ownerCheck = await sql`
      SELECT id FROM companies WHERE id = ${companyId} AND owner_id = ${params.id}
    `

    if (ownerCheck.length > 0) {
      return NextResponse.json({ error: "Cannot delete company owner" }, { status: 400 })
    }

    await sql`
      DELETE FROM user_permissions
      WHERE user_id = ${params.id} AND company_id = ${companyId}
    `

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
