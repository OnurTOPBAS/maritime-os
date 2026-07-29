import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await sql`
      SELECT * FROM roles WHERE id = ${params.id}
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description } = await request.json()

    // Check if role is system role
    const roleCheck = await sql`SELECT is_system FROM roles WHERE id = ${params.id}`
    if (roleCheck.length > 0 && roleCheck[0].is_system) {
      return NextResponse.json({ error: "Cannot edit system roles" }, { status: 403 })
    }

    const result = await sql`
      UPDATE roles
      SET name = ${name}, description = ${description}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if role is system role
    const roleCheck = await sql`SELECT is_system FROM roles WHERE id = ${params.id}`
    if (roleCheck.length > 0 && roleCheck[0].is_system) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 403 })
    }

    await sql`DELETE FROM roles WHERE id = ${params.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
  }
}
