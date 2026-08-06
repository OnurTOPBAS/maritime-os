import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { requireCompanyAccess } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"
import { getCustomPermissions, setCustomPermissions, type Module } from "@/lib/custom-permissions"

/**
 * Bir kullanıcının şirket bazlı özel izinleri.
 *
 * Önceki hali çalışmıyordu: currentUser.companyId diye bir alan yok
 * (getSession yalnızca id/email/name döndürür) ve UUID olan userId'ye
 * parseInt uygulanıyordu (NaN). Artık şirket sorgu parametresiyle
 * belirtilir ve o şirkette yönetici yetkisi aranır.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const currentUser = await requireAuth()
    const { userId } = await params

    const companyId = request.nextUrl.searchParams.get("companyId")
    if (!companyId) {
      return NextResponse.json({ error: "companyId parametresi zorunludur" }, { status: 400 })
    }

    // İzinleri görüntülemek yönetim işlemidir (canDelete = admin seviyesi).
    await requireCompanyAccess(currentUser.id, companyId, "canDelete")

    const permissions = await getCustomPermissions(userId, companyId)

    return NextResponse.json(permissions)
  } catch (error) {
    return handleApiError(error, "Özel izinler")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const currentUser = await requireAuth()
    const { userId } = await params

    const body = await request.json()
    const { module, permissions, companyId } = body

    if (!companyId) {
      return NextResponse.json({ error: "companyId zorunludur" }, { status: 400 })
    }

    await requireCompanyAccess(currentUser.id, companyId, "canDelete")

    if (!module) {
      return NextResponse.json({ error: "module zorunludur" }, { status: 400 })
    }

    await setCustomPermissions(userId, companyId, module as Module, permissions)

    return NextResponse.json({ message: "İzinler güncellendi" })
  } catch (error) {
    return handleApiError(error, "Özel izin güncelleme")
  }
}
