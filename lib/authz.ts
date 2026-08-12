/**
 * Merkezi yetkilendirme (authorization) katmanı.
 *
 * "Bu kullanıcı bu şirkette bu işlemi yapabilir mi?" sorusu burada cevaplanır.
 * API rotaları kendi başına SQL yazıp sahiplik kontrolü yapmaz.
 *
 * YETKİ MODELİ
 * ------------
 * Roller ve izinler veritabanında tutulur:
 *   roles              -> rol tanımları (slug ile koda bağlanır)
 *   permissions        -> (modül, eylem) çiftleri, ör. ships.edit
 *   role_permissions   -> hangi rolün hangi izne sahip olduğu
 *
 * Böylece "Finance Manager faturaları düzenleyebilir ama gemileri yalnızca
 * görüntüler" gibi modül bazlı kurallar tanımlanabilir; yeni rol eklemek için
 * kod değişikliği gerekmez.
 *
 * KULLANIM
 * --------
 *   const user = await requireAuth()
 *
 *   // Modül bazlı (tercih edilen)
 *   await requireModuleAccess(user.id, companyId, "invoices", "edit")
 *
 *   // Modül belirtmeden (eski çağrılarla uyumluluk için)
 *   await requireCompanyAccess(user.id, companyId, "canEdit")
 */

import { sql } from "./db"

/* ------------------------------------------------------------------ *
 * Tipler
 * ------------------------------------------------------------------ */

/** Rol tanımlayıcısı. Veritabanındaki roles.slug değeridir. */
export type UserRole = string

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export"

/** Uygulamanın yetkilendirilebilir bölümleri. */
export type PermissionModule =
  | "ships"
  | "fleets"
  | "fixtures"
  | "voyages"
  | "voyage_account"
  | "voyage_calculator"
  | "certificates"
  | "documents"
  | "invoices"
  | "finance"
  | "companies"
  | "users"
  | "tasks"
  | "messages"
  | "reports"
  | "settings"

/**
 * Modülden bağımsız kaba yetki görünümü.
 * Eski çağrılar bu biçimi kullanır; korunur.
 */
export interface Permission {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

const NO_PERMISSION: Permission = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
}

/** Eski API'deki yetki adlarını veritabanı eylemlerine çevirir. */
const ACTION_BY_PERMISSION_KEY: Record<keyof Permission, PermissionAction> = {
  canView: "view",
  canCreate: "create",
  canEdit: "edit",
  canDelete: "delete",
}

/**
 * Geriye dönük uyumluluk için sabit rol->yetki tablosu.
 * Yalnızca veritabanında izin tanımlı değilken son çare olarak kullanılır
 * (ör. migration henüz çalıştırılmamışsa sistem tamamen kilitlenmesin).
 */
export const ROLE_PERMISSIONS: Record<string, Permission> = {
  admin: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  manager: { canView: true, canCreate: true, canEdit: true, canDelete: false },
  viewer: { canView: true, canCreate: false, canEdit: false, canDelete: false },
}

/** Yetkisiz erişimde fırlatılır. Rotalar bunu 403'e çevirir. */
export class ForbiddenError extends Error {
  constructor(message = "Bu işlem için yetkiniz yok") {
    super(message)
    this.name = "ForbiddenError"
  }
}

/** Kayıt bulunamadığında fırlatılır. Rotalar bunu 404'e çevirir. */
export class NotFoundError extends Error {
  constructor(message = "Kayıt bulunamadı") {
    super(message)
    this.name = "NotFoundError"
  }
}

/* ------------------------------------------------------------------ *
 * Rol izinlerinin yüklenmesi (önbellekli)
 *
 * İzinler her istekte gerekir ama nadiren değişir. Rol başına izin kümesi
 * kısa süreli bellek önbelleğinde tutulur; aksi halde her yetki kontrolü
 * ek bir veritabanı sorgusu doğurur.
 * ------------------------------------------------------------------ */

const PERMISSION_CACHE_TTL_MS = 30_000

/** "modül.eylem" biçiminde izin kümesi. */
type PermissionSet = Set<string>

const permissionCache = new Map<string, { expires: number; permissions: PermissionSet }>()

// Süper yönetici bayrağı da kısa süreli önbelleğe alınır; aksi halde her
// yetki kontrolü fazladan bir "users" sorgusu doğururdu.
const superAdminCache = new Map<string, { expires: number; value: boolean }>()

/** Rol/izin verisi değiştiğinde önbelleği boşaltır. */
export function invalidatePermissionCache(): void {
  permissionCache.clear()
  superAdminCache.clear()
}

/**
 * Kullanıcı sistem geneli süper yönetici mi?
 *
 * Süper yönetici TÜM şirketleri görür ve yönetir; hiçbir şirkete üye olması
 * gerekmez. Yetki kapıları bu bayrağı görürse şirket rollerini atlar.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) return false

  const cached = superAdminCache.get(userId)
  if (cached && cached.expires > Date.now()) return cached.value

  const rows = await sql`SELECT is_super_admin FROM users WHERE id = ${userId}`
  const value = rows.length > 0 && rows[0].is_super_admin === true

  superAdminCache.set(userId, { expires: Date.now() + PERMISSION_CACHE_TTL_MS, value })
  return value
}

async function loadRolePermissions(roleSlug: string): Promise<PermissionSet> {
  const cached = permissionCache.get(roleSlug)
  if (cached && cached.expires > Date.now()) {
    return cached.permissions
  }

  const rows = await sql`
    SELECT p.module, p.action
    FROM roles r
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.slug = ${roleSlug}
  `

  const permissions: PermissionSet = new Set(rows.map((r: any) => `${r.module}.${r.action}`))

  // Veritabanında izin yoksa sabit tabloya düşülür. "*" tüm modülleri temsil
  // eder; bu yalnızca yapılandırma eksikken geçerli bir güvenlik ağıdır.
  if (permissions.size === 0 && ROLE_PERMISSIONS[roleSlug]) {
    const fallback = ROLE_PERMISSIONS[roleSlug]
    for (const [key, action] of Object.entries(ACTION_BY_PERMISSION_KEY)) {
      if (fallback[key as keyof Permission]) permissions.add(`*.${action}`)
    }
  }

  permissionCache.set(roleSlug, {
    expires: Date.now() + PERMISSION_CACHE_TTL_MS,
    permissions,
  })

  return permissions
}

/** Bir rolün sahip olduğu "modül.eylem" izinlerinin listesi (arayüz için). */
export async function getRolePermissions(roleSlug: string): Promise<string[]> {
  const set = await loadRolePermissions(roleSlug)
  return Array.from(set)
}

/** Gelen serbest metni veritabanındaki slug biçimine indirger. */
function normalizeRole(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

/* ------------------------------------------------------------------ *
 * Rol belirleme
 * ------------------------------------------------------------------ */

/**
 * Kullanıcının bir şirketteki rolünü döndürür; üye değilse null.
 *
 * Sıra önemlidir:
 *  1) Şirket sahibi (owner) her zaman admin'dir.
 *  2) user_permissions tablosu (is_active = true olmalı).
 *  3) company_team_members tablosu (paralel üyelik kaydı).
 */
export async function getUserRole(userId: string, companyId: string): Promise<UserRole | null> {
  if (!userId || !companyId) return null

  // Süper yönetici her şirkette admin sayılır.
  if (await isSuperAdmin(userId)) return "admin"

  const owner = await sql`
    SELECT 1 FROM companies WHERE id = ${companyId} AND owner_id = ${userId}
  `
  if (owner.length > 0) return "admin"

  const permission = await sql`
    SELECT role FROM user_permissions
    WHERE user_id = ${userId} AND company_id = ${companyId} AND is_active = true
  `
  if (permission.length > 0) return normalizeRole(permission[0].role) ?? "viewer"

  const member = await sql`
    SELECT role FROM company_team_members
    WHERE user_id = ${userId} AND company_id = ${companyId}
  `
  if (member.length > 0) return normalizeRole(member[0].role) ?? "viewer"

  return null
}

/* ------------------------------------------------------------------ *
 * Yetki kontrolleri
 * ------------------------------------------------------------------ */

/** Bir rolün belirli modül/eylem iznine sahip olup olmadığı. */
async function roleHasPermission(
  roleSlug: string,
  module: PermissionModule | null,
  action: PermissionAction,
): Promise<boolean> {
  const permissions = await loadRolePermissions(roleSlug)

  // Sabit tabloya düşülmüş durum (modülden bağımsız).
  if (permissions.has(`*.${action}`)) return true

  if (module) return permissions.has(`${module}.${action}`)

  // Modül belirtilmediyse: bu eylemi herhangi bir modülde yapabiliyor mu?
  for (const entry of permissions) {
    if (entry.endsWith(`.${action}`)) return true
  }
  return false
}

/** Modül bazlı sessiz kontrol. Tercih edilen yeni API. */
export async function canAccessModule(
  userId: string,
  companyId: string,
  module: PermissionModule,
  action: PermissionAction,
): Promise<boolean> {
  const role = await getUserRole(userId, companyId)
  if (!role) return false
  return roleHasPermission(role, module, action)
}

/** Modül bazlı zorunlu kontrol; yetki yoksa ForbiddenError fırlatır. */
export async function requireModuleAccess(
  userId: string,
  companyId: string,
  module: PermissionModule,
  action: PermissionAction,
): Promise<UserRole> {
  const role = await getUserRole(userId, companyId)

  if (!role || !(await roleHasPermission(role, module, action))) {
    throw new ForbiddenError()
  }

  return role
}

/**
 * Kullanıcının bir şirketteki kaba yetkileri (modülden bağımsız).
 * Eski çağrılarla uyumluluk için korunur.
 */
export async function getPermissions(userId: string, companyId: string): Promise<Permission> {
  const role = await getUserRole(userId, companyId)
  if (!role) return NO_PERMISSION

  const [canView, canCreate, canEdit, canDelete] = await Promise.all([
    roleHasPermission(role, null, "view"),
    roleHasPermission(role, null, "create"),
    roleHasPermission(role, null, "edit"),
    roleHasPermission(role, null, "delete"),
  ])

  return { canView, canCreate, canEdit, canDelete }
}

/**
 * Sessiz kontrol: true/false döner, hata fırlatmaz.
 * `module` verilirse kontrol o modülle sınırlanır (tercih edilen kullanım).
 */
export async function canAccessCompany(
  userId: string,
  companyId: string,
  action: keyof Permission = "canView",
  module?: PermissionModule,
): Promise<boolean> {
  const role = await getUserRole(userId, companyId)
  if (!role) return false
  return roleHasPermission(role, module ?? null, ACTION_BY_PERMISSION_KEY[action])
}

/**
 * Zorunlu kontrol: yetki yoksa ForbiddenError fırlatır.
 *
 * `module` verilirse kontrol o modülle sınırlanır. Verilmezse kullanıcının
 * bu eylemi herhangi bir modülde yapıp yapamadığına bakılır.
 */
export async function requireCompanyAccess(
  userId: string,
  companyId: string,
  action: keyof Permission = "canView",
  module?: PermissionModule,
): Promise<UserRole> {
  const role = await getUserRole(userId, companyId)

  if (!role || !(await roleHasPermission(role, module ?? null, ACTION_BY_PERMISSION_KEY[action]))) {
    throw new ForbiddenError()
  }

  return role
}

/**
 * Sisteme genel (şirkete bağlı olmayan) yönetim işlemleri için kontrol.
 *
 * Roller/izinler gibi kayıtlar tüm şirketleri etkiler; yalnızca en az bir
 * şirkette admin olan kullanıcılar değiştirebilir.
 */
export async function requireSystemAdmin(userId: string): Promise<void> {
  if (!userId) throw new ForbiddenError()

  if (await isSuperAdmin(userId)) return

  const result = await sql`
    SELECT 1 FROM companies WHERE owner_id = ${userId}
    UNION ALL
    SELECT 1 FROM user_permissions
      WHERE user_id = ${userId} AND lower(role) = 'admin' AND is_active = true
    UNION ALL
    SELECT 1 FROM company_team_members
      WHERE user_id = ${userId} AND lower(role) = 'admin'
    LIMIT 1
  `

  if (result.length === 0) {
    throw new ForbiddenError("Bu işlem için yönetici yetkisi gerekiyor")
  }
}

/** Sadece şirket sahibinin yapabileceği işlemler (şirketi silmek gibi). */
export async function requireCompanyOwner(userId: string, companyId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return

  const owner = await sql`
    SELECT 1 FROM companies WHERE id = ${companyId} AND owner_id = ${userId}
  `
  if (owner.length === 0) {
    throw new ForbiddenError("Bu işlemi yalnızca şirket sahibi yapabilir")
  }
}

/* ------------------------------------------------------------------ *
 * Kaynak -> şirket çözümleyiciler
 *
 * Bir kaydın (sefer, gemi, sertifika...) hangi şirkete ait olduğunu bulur.
 * Sahiplik zinciri: voyages -> fixtures -> ships -> fleets -> companies
 * ------------------------------------------------------------------ */

export async function resolveShipCompany(shipId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT f.company_id FROM ships s
    JOIN fleets f ON s.fleet_id = f.id
    WHERE s.id = ${shipId}
  `
  return row?.company_id ?? null
}

export async function resolveVoyageCompany(voyageId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT f.company_id FROM voyages v
    JOIN fixtures fx ON v.fixture_id = fx.id
    JOIN ships s ON fx.ship_id = s.id
    JOIN fleets f ON s.fleet_id = f.id
    WHERE v.id = ${voyageId}
  `
  return row?.company_id ?? null
}

export async function resolveCertificateCompany(certificateId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT f.company_id FROM ship_certificates sc
    JOIN ships s ON sc.ship_id = s.id
    JOIN fleets f ON s.fleet_id = f.id
    WHERE sc.id = ${certificateId}
  `
  return row?.company_id ?? null
}

export async function resolveDocumentCompany(documentId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT COALESCE(fs.company_id, ff.company_id, i.company_id) AS company_id
    FROM documents d
    LEFT JOIN ships s ON d.ship_id = s.id
    LEFT JOIN fleets fs ON s.fleet_id = fs.id
    LEFT JOIN fixtures fx ON d.fixture_id = fx.id
    LEFT JOIN ships s2 ON fx.ship_id = s2.id
    LEFT JOIN fleets ff ON s2.fleet_id = ff.id
    LEFT JOIN invoices i ON d.invoice_id = i.id
    WHERE d.id = ${documentId}
  `
  return row?.company_id ?? null
}

export async function resolveFleetCompany(fleetId: string): Promise<string | null> {
  const [row] = await sql`SELECT company_id FROM fleets WHERE id = ${fleetId}`
  return row?.company_id ?? null
}

export async function resolveFixtureCompany(fixtureId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT f.company_id FROM fixtures fx
    JOIN ships s ON fx.ship_id = s.id
    JOIN fleets f ON s.fleet_id = f.id
    WHERE fx.id = ${fixtureId}
  `
  return row?.company_id ?? null
}

export async function resolveInvoiceCompany(invoiceId: string): Promise<string | null> {
  const [row] = await sql`SELECT company_id FROM invoices WHERE id = ${invoiceId}`
  return row?.company_id ?? null
}

export async function resolveTaskCompany(taskId: string): Promise<string | null> {
  const [row] = await sql`SELECT company_id FROM tasks WHERE id = ${taskId}`
  return row?.company_id ?? null
}

/** fleet_banks -> fleets -> companies */
export async function resolveFleetBankCompany(fleetBankId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT f.company_id FROM fleet_banks fb
    JOIN fleets f ON fb.fleet_id = f.id
    WHERE fb.id = ${fleetBankId}
  `
  return row?.company_id ?? null
}

/** bank_accounts -> fleet_banks -> fleets -> companies */
export async function resolveBankAccountCompany(accountId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT f.company_id FROM bank_accounts ba
    JOIN fleet_banks fb ON ba.bank_id = fb.id
    JOIN fleets f ON fb.fleet_id = f.id
    WHERE ba.id = ${accountId}
  `
  return row?.company_id ?? null
}

/**
 * Genel amaçlı erişim doğrulayıcı.
 *
 * Kaynağın şirketini bulur, bulunamazsa NotFoundError; yetki yoksa
 * ForbiddenError fırlatır. Rotalarda tekrar eden kalıbı tek satıra indirir.
 */
export async function requireResourceAccess(
  userId: string,
  resolver: (id: string) => Promise<string | null>,
  resourceId: string,
  module: PermissionModule,
  action: PermissionAction,
  notFoundMessage = "Kayıt bulunamadı",
): Promise<string> {
  const companyId = await resolver(resourceId)
  if (!companyId) throw new NotFoundError(notFoundMessage)
  await requireModuleAccess(userId, companyId, module, action)
  return companyId
}

/**
 * Bir sefere erişimi doğrular. Sefer yoksa NotFoundError,
 * yetki yoksa ForbiddenError fırlatır.
 */
export async function requireVoyageAccess(
  userId: string,
  voyageId: string,
  action: keyof Permission = "canView",
): Promise<string> {
  const companyId = await resolveVoyageCompany(voyageId)
  if (!companyId) throw new NotFoundError("Sefer bulunamadı")
  await requireCompanyAccess(userId, companyId, action, "voyage_account")
  return companyId
}

/** Bir gemiye erişimi doğrular. */
export async function requireShipAccess(
  userId: string,
  shipId: string,
  action: keyof Permission = "canView",
): Promise<string> {
  const companyId = await resolveShipCompany(shipId)
  if (!companyId) throw new NotFoundError("Gemi bulunamadı")
  await requireCompanyAccess(userId, companyId, action, "ships")
  return companyId
}

/** Bir sertifikaya erişimi doğrular. */
export async function requireCertificateAccess(
  userId: string,
  certificateId: string,
  action: keyof Permission = "canView",
): Promise<string> {
  const companyId = await resolveCertificateCompany(certificateId)
  if (!companyId) throw new NotFoundError("Sertifika bulunamadı")
  await requireCompanyAccess(userId, companyId, action, "certificates")
  return companyId
}

/**
 * Sefer hesabına (voyage_calculations) erişimi doğrular.
 *
 * Bu kayıtlar şirkete değil doğrudan kullanıcıya aittir; bu yüzden
 * şirket rolleri yerine sahiplik kontrol edilir.
 */
export async function requireCalculationOwner(userId: string, calculationId: string): Promise<void> {
  const [row] = await sql`
    SELECT 1 FROM voyage_calculations
    WHERE id = ${calculationId} AND user_id = ${userId}
  `
  if (!row) {
    throw new NotFoundError("Hesap bulunamadı")
  }
}

/** Kullanıcının erişebildiği şirket kimlikleri (liste sorgularını filtrelemek için). */
export async function getAccessibleCompanyIds(userId: string): Promise<string[]> {
  // Süper yönetici tüm şirketleri görür.
  if (await isSuperAdmin(userId)) {
    const all = await sql`SELECT id AS company_id FROM companies`
    return all.map((r: any) => r.company_id).filter(Boolean)
  }

  const rows = await sql`
    SELECT id AS company_id FROM companies WHERE owner_id = ${userId}
    UNION
    SELECT company_id FROM user_permissions
      WHERE user_id = ${userId} AND is_active = true
    UNION
    SELECT company_id FROM company_team_members WHERE user_id = ${userId}
  `
  return rows.map((r: any) => r.company_id).filter(Boolean)
}

/* ------------------------------------------------------------------ *
 * Rol listesi (arayüz için)
 * ------------------------------------------------------------------ */

export interface RoleOption {
  slug: string
  name: string
  description: string | null
  isSystem: boolean
  permissionCount: number
}

/** Ekip üyesine atanabilecek roller. Arayüz açılır listesi bunu kullanır. */
export async function listAssignableRoles(): Promise<RoleOption[]> {
  const rows = await sql`
    SELECT r.slug, r.name, r.description, r.is_system, COUNT(rp.id)::int AS permission_count
    FROM roles r
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    WHERE r.slug IS NOT NULL
    GROUP BY r.id, r.slug, r.name, r.description, r.is_system
    ORDER BY r.is_system DESC, r.name
  `

  return rows.map((r: any) => ({
    slug: r.slug,
    name: r.name,
    description: r.description,
    isSystem: r.is_system,
    permissionCount: r.permission_count,
  }))
}
