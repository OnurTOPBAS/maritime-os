import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { canAccessCompany, ForbiddenError, NotFoundError } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Departman güncelleme/silme.
 *
 * `user.companyId` alanı oturum nesnesinde bulunmadığından koşul daima
 * `company_id = NULL` oluyor, hiçbir kayıt eşleşmiyordu. Şirket artık
 * departman kaydından okunup erişim doğrulanıyor.
 */
async function requireDepartmentAccess(
  userId: string,
  departmentId: string,
  action: "canEdit" | "canDelete",
) {
  const [department] = await sql`
    SELECT company_id FROM departments WHERE id = ${departmentId}
  `
  if (!department) throw new NotFoundError("Departman bulunamadı")

  if (!(await canAccessCompany(userId, department.company_id, action))) {
    throw new ForbiddenError()
  }

  return department.company_id as string
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    await requireDepartmentAccess(user.id, id, "canEdit")

    const { name, description, managerId } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Departman adı zorunludur" }, { status: 400 })
    }

    const result = await sql`
      UPDATE departments
      SET
        name = ${name.trim()},
        description = ${description || null},
        manager_id = ${managerId || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir departman zaten mevcut" }, { status: 400 })
    }
    return handleApiError(error, "Departman güncelleme")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    await requireDepartmentAccess(user.id, id, "canDelete")

    await sql`DELETE FROM departments WHERE id = ${id}`

    return NextResponse.json({ message: "Departman silindi" })
  } catch (error) {
    return handleApiError(error, "Departman silme")
  }
}
