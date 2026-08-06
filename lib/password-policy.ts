/**
 * Parola politikası ve e-posta doğrulaması.
 *
 * Önceden signup ve davet kabul akışlarında hiçbir parola kuralı yoktu:
 * tek karakterli parola bile kabul ediliyordu. reset-password yalnızca
 * uzunluğa bakıyordu. Kurallar burada toplandı ki tüm akışlar aynı
 * politikayı uygulasın.
 */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/** Sık kullanılan, tahmin edilmesi kolay parolalar. */
const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "qwerty123", "password1", "password123",
  "11111111", "abc12345", "sifre123", "parola123", "admin123", "letmein1",
  "welcome1", "1q2w3e4r", "qwertyui",
])

export class PasswordPolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PasswordPolicyError"
  }
}

/**
 * Parolayı politikaya göre doğrular; uymuyorsa PasswordPolicyError fırlatır.
 *
 * Kurallar: en az 8 karakter, harf ve rakam içermeli, yaygın parola olmamalı,
 * kullanıcının e-postasını/adını barındırmamalı.
 */
export function validatePassword(password: unknown, context: { email?: string; name?: string } = {}): void {
  if (typeof password !== "string" || password.length === 0) {
    throw new PasswordPolicyError("Şifre zorunludur")
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new PasswordPolicyError(`Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`)
  }

  // Üst sınır: bcrypt 72 bayttan sonrasını yok sayar ve çok uzun girdi
  // gereksiz CPU tüketir (hesaplama tabanlı servis dışı bırakma riski).
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new PasswordPolicyError(`Şifre en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir`)
  }

  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(password)) {
    throw new PasswordPolicyError("Şifre en az bir harf içermelidir")
  }

  if (!/[0-9]/.test(password)) {
    throw new PasswordPolicyError("Şifre en az bir rakam içermelidir")
  }

  const lowered = password.toLowerCase()

  if (COMMON_PASSWORDS.has(lowered)) {
    throw new PasswordPolicyError("Bu şifre çok yaygın, lütfen daha güçlü bir şifre seçin")
  }

  // Parola kullanıcı adını veya e-posta kullanıcı kısmını içermemeli.
  const emailLocal = context.email?.split("@")[0]?.toLowerCase()
  if (emailLocal && emailLocal.length >= 3 && lowered.includes(emailLocal)) {
    throw new PasswordPolicyError("Şifre e-posta adresinizi içeremez")
  }

  const name = context.name?.trim().toLowerCase()
  if (name && name.length >= 3 && lowered.includes(name)) {
    throw new PasswordPolicyError("Şifre adınızı içeremez")
  }
}

/** Basit ama pratikte yeterli e-posta biçim kontrolü. */
export function validateEmail(email: unknown): string {
  if (typeof email !== "string" || email.trim().length === 0) {
    throw new PasswordPolicyError("E-posta zorunludur")
  }

  const normalized = email.trim().toLowerCase()

  if (normalized.length > 254 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(normalized)) {
    throw new PasswordPolicyError("Geçerli bir e-posta adresi giriniz")
  }

  return normalized
}
