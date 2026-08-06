import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    const requests = await sql`
      SELECT 
        pr.*,
        p.module,
        p.action,
        p.description as permission_description,
        u.name as user_name,
        u.email as user_email,
        rb.name as reviewed_by_name
      FROM permission_requests pr
      INNER JOIN permissions p ON p.id = pr.permission_id
      INNER JOIN users u ON u.id = pr.user_id
      LEFT JOIN users rb ON rb.id = pr.reviewed_by
      WHERE pr.status = ${status}
      ORDER BY pr.requested_at DESC
    `

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching permission requests:", error)
    return NextResponse.json({ error: "Failed to fetch permission requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { permissionId, reason, durationDays } = body

    if (!permissionId || !reason || !durationDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO permission_requests (user_id, permission_id, reason, duration_days)
      VALUES (${user.id}, ${permissionId}, ${reason}, ${durationDays})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating permission request:", error)
    return NextResponse.json({ error: "Failed to create permission request" }, { status: 500 })
  }
}
