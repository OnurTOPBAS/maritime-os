import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const permissions = await sql`
      SELECT * FROM permissions
      ORDER BY module, action
    `
    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
