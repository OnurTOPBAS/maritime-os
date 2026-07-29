import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: request.headers,
    })

    if (!userRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await userRes.json()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")

    let query = `
      SELECT * FROM favorites 
      WHERE user_id = $1
    `
    const params: any[] = [user.id]

    if (type) {
      query += ` AND entity_type = $2`
      params.push(type)
    }

    query += ` ORDER BY created_at DESC`

    const favorites = await sql(query, params)
    return NextResponse.json(favorites)
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: request.headers,
    })

    if (!userRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await userRes.json()
    const { entityType, entityId, entityName } = await request.json()

    await sql(
      `
      INSERT INTO favorites (user_id, entity_type, entity_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING
    `,
      [user.id, entityType, entityId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding favorite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: request.headers,
    })

    if (!userRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await userRes.json()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    await sql(
      `
      DELETE FROM favorites 
      WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
    `,
      [user.id, type, id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
