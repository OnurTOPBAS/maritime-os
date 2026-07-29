import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getCustomPermissions, setCustomPermissions, type Module } from "@/lib/custom-permissions"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    // Check if current user is admin
    const roleCheck = await sql`
      SELECT role FROM user_permissions
      WHERE user_id = ${currentUser.id} AND company_id = ${currentUser.companyId}
    `

    if (roleCheck.length === 0 || roleCheck[0].role !== "admin") {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 })
    }

    const permissions = await getCustomPermissions(Number.parseInt(params.userId), currentUser.companyId)

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "İzinler yüklenirken hata oluştu" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    // Check if current user is admin
    const roleCheck = await sql`
      SELECT role FROM user_permissions
      WHERE user_id = ${currentUser.id} AND company_id = ${currentUser.companyId}
    `

    if (roleCheck.length === 0 || roleCheck[0].role !== "admin") {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 })
    }

    const body = await request.json()
    const { module, permissions } = body

    await setCustomPermissions(Number.parseInt(params.userId), currentUser.companyId, module as Module, permissions)

    return NextResponse.json({ message: "İzinler güncellendi" })
  } catch (error) {
    console.error("Error updating permissions:", error)
    return NextResponse.json({ error: "İzinler güncellenirken hata oluştu" }, { status: 500 })
  }
}
