/**
 * Yetkilendirme katmanı testleri.
 *
 * Bu testler GERÇEK veritabanına bağlanır (yerel PostgreSQL). Amaç, güvenlik
 * kurallarının sorgu düzeyinde de doğru çalıştığını doğrulamak — sahte
 * (mock) veriyle test etmek burada yanıltıcı olurdu.
 *
 * Her test kendi verisini oluşturur ve sonunda temizler.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { sql } from "@/lib/db"
import {
  getUserRole,
  canAccessCompany,
  requireCompanyAccess,
  requireSystemAdmin,
  getAccessibleCompanyIds,
  ForbiddenError,
} from "@/lib/authz"

// Test verisi kimlikleri
let sahipId: string
let uyeId: string
let yabanciId: string
let sirketId: string
let digerSirketId: string

const ek = `test-${Date.now()}`

beforeAll(async () => {
  const [sahip] = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES ('Test Sahip', ${`sahip-${ek}@test.local`}, 'x')
    RETURNING id
  `
  const [uye] = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES ('Test Uye', ${`uye-${ek}@test.local`}, 'x')
    RETURNING id
  `
  const [yabanci] = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES ('Test Yabanci', ${`yabanci-${ek}@test.local`}, 'x')
    RETURNING id
  `
  sahipId = sahip.id
  uyeId = uye.id
  yabanciId = yabanci.id

  const [sirket] = await sql`
    INSERT INTO companies (name, owner_id) VALUES (${`Sirket ${ek}`}, ${sahipId}) RETURNING id
  `
  const [diger] = await sql`
    INSERT INTO companies (name, owner_id) VALUES (${`Diger ${ek}`}, ${yabanciId}) RETURNING id
  `
  sirketId = sirket.id
  digerSirketId = diger.id

  // Üye: viewer rolüyle ekipte
  await sql`
    INSERT INTO company_team_members (company_id, user_id, role)
    VALUES (${sirketId}, ${uyeId}, 'viewer')
  `
})

afterAll(async () => {
  // Şirketler silinince bağlı kayıtlar ON DELETE CASCADE ile temizlenir.
  await sql`DELETE FROM companies WHERE id IN (${sirketId}, ${digerSirketId})`
  await sql`DELETE FROM users WHERE id IN (${sahipId}, ${uyeId}, ${yabanciId})`
})

describe("rol belirleme", () => {
  it("şirket sahibine admin rolü verir", async () => {
    expect(await getUserRole(sahipId, sirketId)).toBe("admin")
  })

  it("ekip üyesinin rolünü döndürür", async () => {
    expect(await getUserRole(uyeId, sirketId)).toBe("viewer")
  })

  it("üye olmayan kullanıcıya rol vermez", async () => {
    // Kritik: eski kod burada varsayılan olarak "viewer" döndürüyordu,
    // yani yabancı bir kullanıcı şirket verisini görebiliyordu.
    expect(await getUserRole(yabanciId, sirketId)).toBeNull()
  })

  it("boş kimliklerde rol vermez", async () => {
    expect(await getUserRole("", sirketId)).toBeNull()
    expect(await getUserRole(sahipId, "")).toBeNull()
  })
})

describe("erişim kontrolü", () => {
  it("sahip her işlemi yapabilir", async () => {
    expect(await canAccessCompany(sahipId, sirketId, "canView")).toBe(true)
    expect(await canAccessCompany(sahipId, sirketId, "canCreate")).toBe(true)
    expect(await canAccessCompany(sahipId, sirketId, "canEdit")).toBe(true)
    expect(await canAccessCompany(sahipId, sirketId, "canDelete")).toBe(true)
  })

  it("viewer yalnızca görüntüleyebilir", async () => {
    expect(await canAccessCompany(uyeId, sirketId, "canView")).toBe(true)
    expect(await canAccessCompany(uyeId, sirketId, "canCreate")).toBe(false)
    expect(await canAccessCompany(uyeId, sirketId, "canEdit")).toBe(false)
    expect(await canAccessCompany(uyeId, sirketId, "canDelete")).toBe(false)
  })

  it("yabancı hiçbir şey yapamaz", async () => {
    expect(await canAccessCompany(yabanciId, sirketId, "canView")).toBe(false)
    expect(await canAccessCompany(yabanciId, sirketId, "canDelete")).toBe(false)
  })

  it("başka şirketin sahibi bu şirkete erişemez", async () => {
    // Kendi şirketinde admin, ama burada yetkisi yok
    expect(await canAccessCompany(yabanciId, digerSirketId, "canDelete")).toBe(true)
    expect(await canAccessCompany(yabanciId, sirketId, "canView")).toBe(false)
  })
})

describe("requireCompanyAccess", () => {
  it("yetkili kullanıcıda rolü döndürür", async () => {
    expect(await requireCompanyAccess(sahipId, sirketId, "canDelete")).toBe("admin")
  })

  it("yetkisiz işlemde ForbiddenError fırlatır", async () => {
    await expect(requireCompanyAccess(uyeId, sirketId, "canDelete")).rejects.toThrow(ForbiddenError)
  })

  it("üye olmayan kullanıcıda ForbiddenError fırlatır", async () => {
    await expect(requireCompanyAccess(yabanciId, sirketId, "canView")).rejects.toThrow(
      ForbiddenError,
    )
  })
})

describe("pasifleştirilmiş üyelik", () => {
  it("is_active=false olan izin yok sayılır", async () => {
    const [kullanici] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES ('Pasif', ${`pasif-${ek}@test.local`}, 'x') RETURNING id
    `
    await sql`
      INSERT INTO user_permissions (user_id, company_id, role, is_active)
      VALUES (${kullanici.id}, ${sirketId}, 'admin', false)
    `

    // Kritik: eski kod is_active sütununu hiç kontrol etmiyordu; sistemden
    // çıkarılan kullanıcı yetkili kalmaya devam ediyordu.
    expect(await getUserRole(kullanici.id, sirketId)).toBeNull()

    await sql`DELETE FROM users WHERE id = ${kullanici.id}`
  })
})

describe("erişilebilir şirket listesi", () => {
  it("sahip olunan ve üye olunan şirketleri döndürür", async () => {
    const sahipSirketleri = await getAccessibleCompanyIds(sahipId)
    expect(sahipSirketleri).toContain(sirketId)
    expect(sahipSirketleri).not.toContain(digerSirketId)

    const uyeSirketleri = await getAccessibleCompanyIds(uyeId)
    expect(uyeSirketleri).toContain(sirketId)
  })

  it("hiçbir şirkete bağlı olmayan kullanıcıya boş liste döndürür", async () => {
    const [yalniz] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES ('Yalniz', ${`yalniz-${ek}@test.local`}, 'x') RETURNING id
    `
    expect(await getAccessibleCompanyIds(yalniz.id)).toHaveLength(0)
    await sql`DELETE FROM users WHERE id = ${yalniz.id}`
  })
})

describe("sistem yöneticisi kontrolü", () => {
  it("şirket sahibi yönetici sayılır", async () => {
    await expect(requireSystemAdmin(sahipId)).resolves.toBeUndefined()
  })

  it("viewer rolündeki üye yönetici değildir", async () => {
    await expect(requireSystemAdmin(uyeId)).rejects.toThrow(ForbiddenError)
  })
})
