import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const banks = await sql`
      SELECT * FROM office_payee_banks
      ORDER BY is_system DESC, name ASC
    `

    return NextResponse.json(banks)
  } catch (error: any) {
    console.error("Error fetching payee banks:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO office_payee_banks (name, is_system)
      VALUES (${name}, false)
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating payee bank:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
