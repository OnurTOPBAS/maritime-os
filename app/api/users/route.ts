import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"
import { checkPermission } from "@/lib/permissions"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
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

    const canView = await checkPermission(user.id, companyId, "canView")
    if (!canView) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        up.role as permission_role,
        CASE 
          WHEN c.owner_id = u.id THEN true
          ELSE false
        END as is_owner,
        true as is_active
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id AND up.company_id = ${companyId}
      LEFT JOIN companies c ON c.id = ${companyId}
      WHERE c.owner_id = u.id OR up.user_id = u.id
      ORDER BY u.name
    `

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, companyId } = body

    const canCreate = await checkPermission(user.id, companyId, "canCreate")
    if (!canCreate) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email, created_at
    `

    await sql`
      INSERT INTO user_permissions (user_id, company_id, role)
      VALUES (${newUser[0].id}, ${companyId}, ${role || "viewer"})
    `

    return NextResponse.json(newUser[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
