/**
 * Modül bazlı yetkilendirme testleri (gerçek veritabanına karşı).
 *
 * scripts/054_rbac_full_permissions.sql çalıştırılmış olmalıdır.
 *
 * Amaç: "Finance Manager faturaları düzenleyebilir ama gemi silemez" gibi
 * kuralların yalnızca veritabanında tanımlı olması yetmez; kodun bu kuralları
 * fiilen uyguladığı doğrulanmalıdır.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { sql } from "@/lib/db"
import {
  canAccessModule,
  requireModuleAccess,
  canAccessCompany,
  listAssignableRoles,
  invalidatePermissionCache,
  ForbiddenError,
} from "@/lib/authz"

const ek = `rbac-${Date.now()}`
let sirketId: string
let sahipId: string

/** Rol başına bir test kullanıcısı. */
const kullanicilar: Record<string, string> = {}
const ROLLER = ["viewer", "manager", "operations_manager", "technical_manager", "finance_manager"]

beforeAll(async () => {
  invalidatePermissionCache()

  const [sahip] = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES ('RBAC Sahip', ${`sahip-${ek}@test.local`}, 'x') RETURNING id
  `
  sahipId = sahip.id

  const [sirket] = await sql`
    INSERT INTO companies (name, owner_id) VALUES (${`RBAC ${ek}`}, ${sahipId}) RETURNING id
  `
  sirketId = sirket.id

  for (const rol of ROLLER) {
    const [u] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${rol}, ${`${rol}-${ek}@test.local`}, 'x') RETURNING id
    `
    kullanicilar[rol] = u.id
    await sql`
      INSERT INTO company_team_members (company_id, user_id, role)
      VALUES (${sirketId}, ${u.id}, ${rol})
    `
  }
})

afterAll(async () => {
  await sql`DELETE FROM companies WHERE id = ${sirketId}`
  await sql`DELETE FROM users WHERE email LIKE ${`%${ek}@test.local`}`
})

describe("rol kataloğu", () => {
  it("altı rolü de listeler", async () => {
    const roller = await listAssignableRoles()
    const slugs = roller.map((r) => r.slug)

    expect(slugs).toContain("admin")
    expect(slugs).toContain("manager")
    expect(slugs).toContain("viewer")
    expect(slugs).toContain("operations_manager")
    expect(slugs).toContain("technical_manager")
    expect(slugs).toContain("finance_manager")
  })

  it("her rolün izin sayısı tanımlı", async () => {
    const roller = await listAssignableRoles()
    for (const rol of roller) {
      expect(rol.permissionCount).toBeGreaterThan(0)
    }
  })

  it("admin en geniş yetkiye sahip", async () => {
    const roller = await listAssignableRoles()
    const admin = roller.find((r) => r.slug === "admin")!
    const viewer = roller.find((r) => r.slug === "viewer")!
    expect(admin.permissionCount).toBeGreaterThan(viewer.permissionCount)
  })
})

describe("Finance Manager", () => {
  const u = () => kullanicilar.finance_manager

  it("faturaları yönetebilir", async () => {
    expect(await canAccessModule(u(), sirketId, "invoices", "edit")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "invoices", "delete")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "finance", "create")).toBe(true)
  })

  it("gemileri yalnızca görüntüleyebilir", async () => {
    expect(await canAccessModule(u(), sirketId, "ships", "view")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "ships", "edit")).toBe(false)
    expect(await canAccessModule(u(), sirketId, "ships", "delete")).toBe(false)
  })

  it("gemi silmeye çalışınca engellenir", async () => {
    await expect(requireModuleAccess(u(), sirketId, "ships", "delete")).rejects.toThrow(
      ForbiddenError,
    )
  })

  it("raporları dışa aktarabilir", async () => {
    expect(await canAccessModule(u(), sirketId, "reports", "export")).toBe(true)
  })
})

describe("Technical Manager", () => {
  const u = () => kullanicilar.technical_manager

  it("gemi ve sertifikaları yönetebilir", async () => {
    expect(await canAccessModule(u(), sirketId, "ships", "edit")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "certificates", "create")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "documents", "delete")).toBe(true)
  })

  it("finansal verilere hiç erişemez", async () => {
    expect(await canAccessModule(u(), sirketId, "finance", "view")).toBe(false)
    expect(await canAccessModule(u(), sirketId, "invoices", "view")).toBe(false)
    expect(await canAccessModule(u(), sirketId, "invoices", "edit")).toBe(false)
  })

  it("seferleri yalnızca görüntüleyebilir", async () => {
    expect(await canAccessModule(u(), sirketId, "voyages", "view")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "voyages", "edit")).toBe(false)
  })
})

describe("Operations Manager", () => {
  const u = () => kullanicilar.operations_manager

  it("sefer ve fixture yönetebilir", async () => {
    expect(await canAccessModule(u(), sirketId, "voyages", "create")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "fixtures", "edit")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "voyage_account", "delete")).toBe(true)
  })

  it("faturaları görür ama değiştiremez", async () => {
    expect(await canAccessModule(u(), sirketId, "invoices", "view")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "invoices", "edit")).toBe(false)
  })
})

describe("Viewer", () => {
  const u = () => kullanicilar.viewer

  it("her modülü görüntüler", async () => {
    expect(await canAccessModule(u(), sirketId, "ships", "view")).toBe(true)
    expect(await canAccessModule(u(), sirketId, "invoices", "view")).toBe(true)
  })

  it("hiçbir modülde yazamaz", async () => {
    expect(await canAccessModule(u(), sirketId, "ships", "create")).toBe(false)
    expect(await canAccessModule(u(), sirketId, "invoices", "edit")).toBe(false)
    expect(await canAccessModule(u(), sirketId, "documents", "delete")).toBe(false)
  })
})

describe("şirket sahibi", () => {
  it("her modülde tam yetkilidir", async () => {
    expect(await canAccessModule(sahipId, sirketId, "ships", "delete")).toBe(true)
    expect(await canAccessModule(sahipId, sirketId, "finance", "delete")).toBe(true)
    expect(await canAccessModule(sahipId, sirketId, "settings", "edit")).toBe(true)
  })
})

describe("eski API ile uyumluluk", () => {
  it("modül verilmeden çalışmaya devam eder", async () => {
    // Finance Manager bir yerde düzenleme yapabildiği için genel canEdit true
    expect(await canAccessCompany(kullanicilar.finance_manager, sirketId, "canEdit")).toBe(true)
    // Viewer hiçbir yerde düzenleyemez
    expect(await canAccessCompany(kullanicilar.viewer, sirketId, "canEdit")).toBe(false)
  })

  it("modül verildiğinde kontrol daraltılır", async () => {
    const u = kullanicilar.finance_manager
    expect(await canAccessCompany(u, sirketId, "canEdit", "invoices")).toBe(true)
    expect(await canAccessCompany(u, sirketId, "canEdit", "ships")).toBe(false)
  })

  it("üye olmayan hiçbir şey yapamaz", async () => {
    const [yabanci] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES ('Yabanci', ${`yabanci-${ek}@test.local`}, 'x') RETURNING id
    `
    expect(await canAccessModule(yabanci.id, sirketId, "ships", "view")).toBe(false)
    await sql`DELETE FROM users WHERE id = ${yabanci.id}`
  })
})
