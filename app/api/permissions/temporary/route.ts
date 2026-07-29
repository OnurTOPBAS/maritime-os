import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const whereClause = userId ? sql`WHERE tp.user_id = ${userId}` : sql``

    const temporaryPermissions = await sql`
      SELECT 
        tp.*,
        p.module,
        p.action,
        p.description as permission_description,
        u.name as user_name,
        u.email as user_email,
        gb.name as granted_by_name
      FROM temporary_permissions tp
      INNER JOIN permissions p ON p.id = tp.permission_id
      INNER JOIN users u ON u.id = tp.user_id
      INNER JOIN users gb ON gb.id = tp.granted_by
      ${whereClause}
      ORDER BY tp.created_at DESC
    `

    return NextResponse.json(temporaryPermissions)
  } catch (error) {
    console.error("Error fetching temporary permissions:", error)
    return NextResponse.json({ error: "Failed to fetch temporary permissions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, permissionId, reason, durationDays } = body

    if (!userId || !permissionId || !durationDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    const result = await sql`
      INSERT INTO temporary_permissions (user_id, permission_id, granted_by, reason, expires_at)
      VALUES (${userId}, ${permissionId}, ${user.id}, ${reason || null}, ${expiresAt.toISOString()})
      RETURNING *
    `

    // Log the permission change
    await sql`
      INSERT INTO permission_change_history (user_id, changed_by, change_type, permission_id, reason)
      VALUES (${userId}, ${user.id}, 'grant_temporary', ${permissionId}, ${reason || null})
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating temporary permission:", error)
    return NextResponse.json({ error: "Failed to create temporary permission" }, { status: 500 })
  }
}
