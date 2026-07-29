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

    const groups = await sql`
      SELECT 
        g.*,
        COUNT(DISTINCT ugm.user_id) as member_count
      FROM user_groups g
      LEFT JOIN user_group_members ugm ON g.id = ugm.group_id
      WHERE g.company_id = ${user.companyId}
      GROUP BY g.id
      ORDER BY g.name
    `

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json({ error: "Gruplar yüklenirken hata oluştu" }, { status: 500 })
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
      INSERT INTO user_groups (company_id, name, description)
      VALUES (${user.companyId}, ${name}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error creating group:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir grup zaten mevcut" }, { status: 400 })
    }
    return NextResponse.json({ error: "Grup oluşturulurken hata oluştu" }, { status: 500 })
  }
}
