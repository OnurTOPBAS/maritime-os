import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, managerId } = body

    const result = await sql`
      UPDATE departments
      SET 
        name = ${name},
        description = ${description || null},
        manager_id = ${managerId || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id} AND company_id = ${user.companyId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Departman bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error updating department:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir departman zaten mevcut" }, { status: 400 })
    }
    return NextResponse.json({ error: "Departman güncellenirken hata oluştu" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    await sql`
      DELETE FROM departments
      WHERE id = ${params.id} AND company_id = ${user.companyId}
    `

    return NextResponse.json({ message: "Departman silindi" })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Departman silinirken hata oluştu" }, { status: 500 })
  }
}
