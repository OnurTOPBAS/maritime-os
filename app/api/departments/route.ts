import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const departments = await sql`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.created_at,
        COUNT(u.id) as member_count
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      WHERE d.company_id = ${user.companyId}
      GROUP BY d.id
      ORDER BY d.name
    `

    return NextResponse.json(departments)
  } catch (error: any) {
    console.error("Error fetching departments:", error)
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json(
        {
          error: "TABLE_NOT_EXISTS",
          message: "Departmanlar tablosu henüz oluşturulmamış",
        },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: "Departmanlar yüklenirken hata oluştu" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    const result = await sql`
      INSERT INTO departments (company_id, name, description)
      VALUES (${user.companyId}, ${name}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error creating department:", error)
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json(
        {
          error: "TABLE_NOT_EXISTS",
          message: "Departmanlar tablosu henüz oluşturulmamış",
        },
        { status: 400 },
      )
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir departman zaten mevcut" }, { status: 400 })
    }
    return NextResponse.json({ error: "Departman oluşturulurken hata oluştu" }, { status: 500 })
  }
}
