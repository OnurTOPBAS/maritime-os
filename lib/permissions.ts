/**
 * ESKİ yetki modülü — artık merkezi lib/authz.ts katmanının ince bir sarmalayıcısı.
 *
 * Bu dosya geriye dönük uyumluluk için duruyor: halihazırda
 * getUserPermissions / checkPermission / requirePermission kullanan rotalar
 * çalışmaya devam etsin diye. YENİ kodda doğrudan lib/authz.ts kullanın.
 *
 * Neden değişti:
 *  - Kendi neon() bağlantısını kuruyordu -> artık merkezi lib/db.ts kullanılıyor.
 *  - user_permissions.is_active kontrol edilmiyordu -> pasif kullanıcı hâlâ
 *    yetkili sayılıyordu; authz.ts bunu kontrol eder.
 *  - Üyeliği olmayan kullanıcıya "viewer" veriyordu -> yabancı bir kullanıcı
 *    başka şirketin verisini görebiliyordu; artık hiçbir yetki verilmez.
 *  - Kullanıcı kimliği/rolü console.log ile loglanıyordu (PII sızıntısı).
 */

import { sql } from "./db"
import {
  ROLE_PERMISSIONS,
  getPermissions,
  canAccessCompany,
  requireCompanyAccess,
  type Permission,
  type UserRole,
} from "./authz"

export { ROLE_PERMISSIONS }
export type { Permission, UserRole }

export async function getUserPermissions(userId: string, companyId: string): Promise<Permission> {
  return getPermissions(userId, companyId)
}

export async function checkPermission(
  userId: string,
  companyId: string,
  action: keyof Permission,
): Promise<boolean> {
  return canAccessCompany(userId, companyId, action)
}

export async function requirePermission(userId: string, companyId: string, action: keyof Permission) {
  await requireCompanyAccess(userId, companyId, action)
}

/** Kullanıcının erişebildiği şirketler (sahip olduğu + üye olduğu). */
export async function getUserCompanies(userId: string) {
  try {
    // Süper yönetici tüm şirketleri (admin olarak) görür.
    const [u] = await sql`SELECT is_super_admin FROM users WHERE id = ${userId}`
    if (u?.is_super_admin === true) {
      return await sql`SELECT c.*, 'admin' AS role FROM companies c ORDER BY c.name`
    }

    return await sql`
      SELECT DISTINCT c.*, COALESCE(up.role, ctm.role,
               CASE WHEN c.owner_id = ${userId} THEN 'admin' END) AS role
      FROM companies c
      LEFT JOIN user_permissions up
        ON up.company_id = c.id AND up.user_id = ${userId} AND up.is_active = true
      LEFT JOIN company_team_members ctm
        ON ctm.company_id = c.id AND ctm.user_id = ${userId}
      WHERE c.owner_id = ${userId} OR up.user_id IS NOT NULL OR ctm.user_id IS NOT NULL
      ORDER BY c.name
    `
  } catch (error) {
    console.error("Kullanıcı şirketleri alınamadı:", error)
    return []
  }
}
