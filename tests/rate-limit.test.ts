/**
 * Giriş oran sınırlama testleri (gerçek veritabanına karşı).
 *
 * scripts/052_add_login_attempts.sql çalıştırılmış olmalıdır.
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { sql } from "@/lib/db"
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  clearFailedAttempts,
  getClientIp,
  RateLimitError,
} from "@/lib/rate-limit"

const kimlik = `ratelimit-test-${Date.now()}@test.local`
const ip = "203.0.113.42" // belgeleme için ayrılmış IP aralığı

async function temizle() {
  await sql`DELETE FROM login_attempts WHERE identifier = ${kimlik} OR ip_address = ${ip}`
}

beforeEach(temizle)
afterAll(temizle)

describe("giriş oran sınırlama", () => {
  it("deneme yokken geçişe izin verir", async () => {
    await expect(checkLoginRateLimit(kimlik, ip)).resolves.toBeUndefined()
  })

  it("sınırın altındaki başarısız denemelerde engellemez", async () => {
    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt(kimlik, ip, false)
    }
    await expect(checkLoginRateLimit(kimlik, ip)).resolves.toBeUndefined()
  })

  it("5 başarısız denemeden sonra engeller", async () => {
    for (let i = 0; i < 5; i++) {
      await recordLoginAttempt(kimlik, ip, false)
    }
    await expect(checkLoginRateLimit(kimlik, ip)).rejects.toThrow(RateLimitError)
  })

  it("başarılı denemeler sınıra sayılmaz", async () => {
    for (let i = 0; i < 10; i++) {
      await recordLoginAttempt(kimlik, ip, true)
    }
    await expect(checkLoginRateLimit(kimlik, ip)).resolves.toBeUndefined()
  })

  it("başarılı giriş sonrası geçmiş temizlenince engel kalkar", async () => {
    for (let i = 0; i < 5; i++) {
      await recordLoginAttempt(kimlik, ip, false)
    }
    await expect(checkLoginRateLimit(kimlik, ip)).rejects.toThrow(RateLimitError)

    await clearFailedAttempts(kimlik)
    // IP sınırı (20) hâlâ altında olduğu için geçmeli
    await expect(checkLoginRateLimit(kimlik, null)).resolves.toBeUndefined()
  })

  it("büyük/küçük harf farkı sınırı baypas etmez", async () => {
    for (let i = 0; i < 5; i++) {
      await recordLoginAttempt(kimlik.toUpperCase(), ip, false)
    }
    await expect(checkLoginRateLimit(kimlik, ip)).rejects.toThrow(RateLimitError)
  })

  it("farklı hesap aynı IP'den denenebilir (IP sınırına kadar)", async () => {
    for (let i = 0; i < 5; i++) {
      await recordLoginAttempt(kimlik, ip, false)
    }
    // Aynı IP ama farklı hesap: hesap sınırı devrede değil, IP sınırı (20) altında
    await expect(checkLoginRateLimit("baska@test.local", ip)).resolves.toBeUndefined()
  })
})

describe("istemci IP çıkarımı", () => {
  function istek(headers: Record<string, string>) {
    return new Request("http://localhost/api/auth/signin", { headers })
  }

  it("x-forwarded-for başlığından ilk adresi alır", () => {
    expect(getClientIp(istek({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4")
  })

  it("x-real-ip başlığını kullanır", () => {
    expect(getClientIp(istek({ "x-real-ip": "9.8.7.6" }))).toBe("9.8.7.6")
  })

  it("başlık yoksa null döndürür", () => {
    expect(getClientIp(istek({}))).toBeNull()
  })
})
