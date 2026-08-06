import { describe, it, expect } from "vitest"
import { slugify, uniqueSlug } from "@/lib/slug"

describe("slugify", () => {
  it("basit adları küçük harfe ve alt çizgiye çevirir", () => {
    expect(slugify("Account Manager")).toBe("account_manager")
    expect(slugify("Finance Manager")).toBe("finance_manager")
  })

  it("Türkçe karakterleri sadeleştirir", () => {
    expect(slugify("Operasyon Müdürü")).toBe("operasyon_muduru")
    expect(slugify("Gemi Şefi")).toBe("gemi_sefi")
    expect(slugify("İç Denetçi")).toBe("ic_denetci")
  })

  it("art arda semboller tek alt çizgi olur", () => {
    expect(slugify("Rol -- A / B")).toBe("rol_a_b")
  })

  it("baştaki ve sondaki alt çizgileri atar", () => {
    expect(slugify("  Yönetici  ")).toBe("yonetici")
    expect(slugify("--rol--")).toBe("rol")
  })

  it("uzunluğu 50 karakterle sınırlar", () => {
    expect(slugify("a".repeat(80)).length).toBeLessThanOrEqual(50)
  })
})

describe("uniqueSlug", () => {
  it("çakışma yoksa temel slug'ı döndürür", () => {
    expect(uniqueSlug("Account Manager", ["admin", "viewer"])).toBe("account_manager")
  })

  it("çakışmada sıra numarası ekler", () => {
    expect(uniqueSlug("Manager", ["manager"])).toBe("manager_2")
    expect(uniqueSlug("Manager", ["manager", "manager_2"])).toBe("manager_3")
  })

  it("boş/sembolik addan geçerli slug üretir", () => {
    const s = uniqueSlug("!!!", [])
    expect(s.length).toBeGreaterThan(0)
    expect(s).toMatch(/^[a-z0-9_]+$/)
  })
})
