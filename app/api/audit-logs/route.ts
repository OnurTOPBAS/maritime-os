import { type NextRequest, NextResponse } from "next/server"
import { getActivityLogs } from "@/lib/audit-logger"
import { requireAuth } from "@/lib/session"
import { canAccessCompany, requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const entityType = searchParams.get("entityType") || undefined
    const entityId = searchParams.get("entityId") || undefined
    const requestedUserId = searchParams.get("userId") || undefined
    const companyId = searchParams.get("companyId") || undefined

    // Limit sınırlanır: aksi halde tek istekle tüm denetim geçmişi çekilebilir.
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? "50", 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50

    // Başka bir kullanıcının etkinlik geçmişi yalnızca yöneticilere açıktır.
    // Önceden userId parametresi doğrudan geçiriliyordu: herkes bir başkasının
    // tüm işlem geçmişini görüntüleyebiliyordu.
    if (requestedUserId && requestedUserId !== user.id) {
      await requireSystemAdmin(user.id)
    }

    // Şirket bazlı sorguda o şirkete erişim aranır.
    if (companyId && !(await canAccessCompany(user.id, companyId, "canView"))) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 })
    }

    // Kullanıcı belirtilmediyse: yöneticiler tüm kayıtları görür,
    // diğer kullanıcılar yalnızca kendi geçmişlerini.
    let effectiveUserId = requestedUserId
    if (!effectiveUserId) {
      const isAdmin = await requireSystemAdmin(user.id).then(
        () => true,
        () => false,
      )
      effectiveUserId = isAdmin ? undefined : user.id
    }

    const logs = await getActivityLogs({
      entityType,
      entityId,
      userId: effectiveUserId,
      limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    return handleApiError(error, "Denetim kayıtları")
  }
}
