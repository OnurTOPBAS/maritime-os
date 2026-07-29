import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const userId = userResult[0].id

    const templates = await sql`
      SELECT id, name, description, ship_name, created_at
      FROM voyage_calc_templates
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(templates)
  } catch (error) {
    console.error("[v0] Fetch templates error:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const userId = userResult[0].id

    const body = await request.json()

    const result = await sql`
      INSERT INTO voyage_calc_templates (
        user_id, name, description, ship_id, ship_name, service_speed, running_cost_per_day,
        fuel_consumption, fo_price, mgo_price, legs, operations, cost_items
      ) VALUES (
        ${userId}, ${body.name}, ${body.description || ""}, ${body.ship_id}, ${body.ship_name},
        ${body.service_speed}, ${body.running_cost_per_day}, ${JSON.stringify(body.fuel_consumption || {})},
        ${body.fo_price}, ${body.mgo_price}, ${JSON.stringify(body.legs || [])},
        ${JSON.stringify(body.operations || {})}, ${JSON.stringify(body.cost_items || [])}
      )
      RETURNING id
    `

    return NextResponse.json({ id: result[0].id, message: "Template created successfully" })
  } catch (error) {
    console.error("[v0] Create template error:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
