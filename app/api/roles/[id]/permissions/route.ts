import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const permissions = await sql`
      SELECT p.*
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ${params.id}
      ORDER BY p.module, p.action
    `
    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching role permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { permissionIds } = await request.json()

    // Delete existing permissions
    await sql`DELETE FROM role_permissions WHERE role_id = ${params.id}`

    // Insert new permissions
    if (permissionIds && permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        await sql`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (${params.id}, ${permissionId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating role permissions:", error)
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 })
  }
}
