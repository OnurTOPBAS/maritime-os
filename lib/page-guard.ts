/**
 * Sunucu bileşenleri (sayfalar) için modül bazlı erişim kapısı.
 *
 * Menüyü gizlemek yeterli değildir; kullanıcı URL'yi elle yazabilir. Bu yüzden
 * her korumalı dashboard sayfası, requireAuth'tan hemen sonra bu kapıyı çağırır.
 * Yetki yoksa kullanıcı sessizce güvenli bir sayfaya yönlendirilir.
 *
 *   const user = await requireAuth()
 *   await guardPage(user.id, "ships")        // ships.view yoksa /dashboard'a
 */

import { redirect } from "next/navigation"
import {
  requireAnyModuleAccess,
  requireSystemAdmin,
  isSuperAdmin,
  ForbiddenError,
  type PermissionModule,
  type PermissionAction,
} from "./authz"

/** Modül görüntüleme (veya belirtilen eylem) yetkisi yoksa yönlendirir. */
export async function guardPage(
  userId: string,
  module: PermissionModule,
  action: PermissionAction = "view",
  fallback = "/dashboard",
): Promise<void> {
  try {
    await requireAnyModuleAccess(userId, module, action)
  } catch (e) {
    if (e instanceof ForbiddenError) redirect(fallback)
    throw e
  }
}

/** Yalnızca yönetici (admin/owner) veya süper yönetici erişebilir. */
export async function guardAdminPage(userId: string, fallback = "/dashboard"): Promise<void> {
  try {
    await requireSystemAdmin(userId)
  } catch (e) {
    if (e instanceof ForbiddenError) redirect(fallback)
    throw e
  }
}

/** Yalnızca süper yönetici erişebilir (sistem geneli hassas sayfalar). */
export async function guardSuperAdminPage(userId: string, fallback = "/dashboard"): Promise<void> {
  if (!(await isSuperAdmin(userId))) redirect(fallback)
}
