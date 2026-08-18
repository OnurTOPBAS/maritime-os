import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { getAccessibleModuleActions, isSuperAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Giriş yapmış kullanıcının erişebildiği "modül.eylem" izinleri (menü ve
 * arayüz kapılaması için). Süper yönetici -> { superAdmin: true }.
 */
export async function GET() {
  try {
    const user = await requireAuth()
    const superAdmin = await isSuperAdmin(user.id)
    const perms = await getAccessibleModuleActions(user.id)
    return NextResponse.json({ superAdmin, actions: Array.from(perms) })
  } catch (error) {
    return handleApiError(error, "Yetkiler")
  }
}
