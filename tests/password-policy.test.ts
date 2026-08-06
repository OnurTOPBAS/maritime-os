import { describe, it, expect } from "vitest"
import {
  validatePassword,
  validateEmail,
  PasswordPolicyError,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy"

describe("parola politikası", () => {
  const kullanici = { email: "onur@sirket.com", name: "Onur" }

  it("güçlü parolaları kabul eder", () => {
    expect(() => validatePassword("Gemi2024Liman", kullanici)).not.toThrow()
    expect(() => validatePassword("Deniz7ivi!", kullanici)).not.toThrow()
  })

  it("çok kısa parolayı reddeder", () => {
    expect(() => validatePassword("Ab1", kullanici)).toThrow(PasswordPolicyError)
    // Sınırın bir altı: reddedilmeli
    expect(() => validatePassword("A".repeat(PASSWORD_MIN_LENGTH - 2) + "1", kullanici)).toThrow()
  })

  it("tam sınır uzunluğundaki parolayı kabul eder", () => {
    const sinirda = "A".repeat(PASSWORD_MIN_LENGTH - 1) + "1"
    expect(sinirda).toHaveLength(PASSWORD_MIN_LENGTH)
    expect(() => validatePassword(sinirda, kullanici)).not.toThrow()
  })

  it("boş veya parola olmayan girdiyi reddeder", () => {
    expect(() => validatePassword("", kullanici)).toThrow(PasswordPolicyError)
    expect(() => validatePassword(undefined, kullanici)).toThrow(PasswordPolicyError)
    expect(() => validatePassword(12345678 as unknown, kullanici)).toThrow(PasswordPolicyError)
  })

  it("rakam içermeyen parolayı reddeder", () => {
    expect(() => validatePassword("abcdefghij", kullanici)).toThrow(/rakam/i)
  })

  it("harf içermeyen parolayı reddeder", () => {
    expect(() => validatePassword("1234567890", kullanici)).toThrow(/harf/i)
  })

  it("yaygın parolaları reddeder", () => {
    expect(() => validatePassword("password123", kullanici)).toThrow(/yaygın/i)
    expect(() => validatePassword("Password123", kullanici)).toThrow(/yaygın/i) // büyük/küçük harf duyarsız
  })

  it("kullanıcının e-postasını içeren parolayı reddeder", () => {
    expect(() => validatePassword("onur12345", kullanici)).toThrow(/e-posta/i)
  })

  it("kullanıcının adını içeren parolayı reddeder", () => {
    expect(() => validatePassword("xxOnur2024", { name: "Onur" })).toThrow(/ad/i)
  })

  it("aşırı uzun parolayı reddeder (CPU tüketimi)", () => {
    expect(() => validatePassword("A1" + "x".repeat(200), kullanici)).toThrow(/en fazla/i)
  })

  it("kullanıcı bağlamı olmadan da çalışır", () => {
    expect(() => validatePassword("Gemi2024Liman")).not.toThrow()
  })
})

describe("e-posta doğrulama", () => {
  it("geçerli adresleri kabul eder ve küçük harfe indirger", () => {
    expect(validateEmail("Onur@Sirket.COM")).toBe("onur@sirket.com")
    expect(validateEmail("  bos@bosluk.com  ")).toBe("bos@bosluk.com")
  })

  it("geçersiz adresleri reddeder", () => {
    for (const gecersiz of ["gecersiz", "a@b", "@sirket.com", "onur@", "onur @sirket.com", ""]) {
      expect(() => validateEmail(gecersiz)).toThrow(PasswordPolicyError)
    }
  })

  it("metin olmayan girdiyi reddeder", () => {
    expect(() => validateEmail(null)).toThrow(PasswordPolicyError)
    expect(() => validateEmail(42)).toThrow(PasswordPolicyError)
  })
})
