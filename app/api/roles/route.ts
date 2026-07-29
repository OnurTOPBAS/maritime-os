import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Fetching roles...")
    const roles = await sql`
      SELECT r.*, COUNT(rp.id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.name
    `
    console.log("[v0] Roles fetched:", roles.length)
    return NextResponse.json(roles)
  } catch (error) {
    console.error("[v0] Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()
    console.log("[v0] Creating role:", name)
    const result = await sql`
      INSERT INTO roles (name, description, is_system)
      VALUES (${name}, ${description}, false)
      RETURNING *
    `
    console.log("[v0] Role created:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error creating role:", error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
