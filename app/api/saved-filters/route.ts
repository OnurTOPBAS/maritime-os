import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")

    let filters
    if (entityType) {
      filters = await sql`
        SELECT * FROM saved_filters
        WHERE user_id = ${user.id} AND entity_type = ${entityType}
        ORDER BY is_default DESC, name ASC
      `
    } else {
      filters = await sql`
        SELECT * FROM saved_filters
        WHERE user_id = ${user.id}
        ORDER BY entity_type, is_default DESC, name ASC
      `
    }

    return NextResponse.json(filters)
  } catch (error) {
    console.error("Error fetching saved filters:", error)
    return NextResponse.json({ error: "Failed to fetch filters" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, entityType, filters, isDefault } = await request.json()

    // If setting as default, unset other defaults for this entity type
    if (isDefault) {
      await sql`
        UPDATE saved_filters
        SET is_default = false
        WHERE user_id = ${user.id} AND entity_type = ${entityType}
      `
    }

    const newFilter = await sql`
      INSERT INTO saved_filters (user_id, name, entity_type, filters, is_default)
      VALUES (${user.id}, ${name}, ${entityType}, ${JSON.stringify(filters)}, ${isDefault || false})
      RETURNING *
    `

    return NextResponse.json(newFilter[0])
  } catch (error) {
    console.error("Error creating saved filter:", error)
    return NextResponse.json({ error: "Failed to create filter" }, { status: 500 })
  }
}
