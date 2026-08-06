/**
 * Giriş denemeleri için oran sınırlama (brute-force koruması).
 *
 * G-07: signin uç noktasında hiçbir sınır yoktu; saldırgan sınırsız
 * parola denemesi yapabiliyordu.
 *
 * Neden veritabanı tabanlı: Uygulama sunucusuz (serverless) ortamda çalışır;
 * her istek ayrı bir örnekte işlenebildiği için bellek içi sayaçlar güvenilmez.
 *
 * Kurulum: scripts/052_add_login_attempts.sql çalıştırılmalıdır.
 */

import { sql } from "./db"

/** Aynı hesaba art arda başarısız deneme sınırı. */
const MAX_FAILED_PER_IDENTIFIER = 5
/** Aynı IP adresinden yapılabilecek başarısız deneme sınırı (hesap sayma saldırısı). */
const MAX_FAILED_PER_IP = 20
/** Sınırların değerlendirildiği zaman penceresi (dakika). */
const WINDOW_MINUTES = 15

export class RateLimitError extends Error {
  constructor(message = "Çok fazla başarısız deneme. Lütfen bir süre sonra tekrar deneyin.") {
    super(message)
    this.name = "RateLimitError"
  }
}

/** İsteği yapanın IP adresini ters vekil başlıklarından çıkarır. */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64)
  return request.headers.get("x-real-ip")?.slice(0, 64) ?? null
}

/**
 * Sınır aşıldıysa RateLimitError fırlatır.
 *
 * Yalnızca BAŞARISIZ denemeler sayılır; başarılı giriş sayacı sıfırlar
 * (clearAttempts). Böylece normal kullanıcı engellenmez.
 */
export async function checkLoginRateLimit(identifier: string, ip: string | null): Promise<void> {
  const key = identifier.trim().toLowerCase()

  const [byIdentifier] = await sql`
    SELECT COUNT(*)::int AS count FROM login_attempts
    WHERE identifier = ${key}
      AND successful = false
      AND attempted_at > NOW() - (${WINDOW_MINUTES} || ' minutes')::interval
  `

  if ((byIdentifier?.count ?? 0) >= MAX_FAILED_PER_IDENTIFIER) {
    throw new RateLimitError()
  }

  if (ip) {
    const [byIp] = await sql`
      SELECT COUNT(*)::int AS count FROM login_attempts
      WHERE ip_address = ${ip}
        AND successful = false
        AND attempted_at > NOW() - (${WINDOW_MINUTES} || ' minutes')::interval
    `

    if ((byIp?.count ?? 0) >= MAX_FAILED_PER_IP) {
      throw new RateLimitError()
    }
  }
}

/** Denemeyi kaydeder. Kayıt hatası giriş akışını bozmamalıdır. */
export async function recordLoginAttempt(
  identifier: string,
  ip: string | null,
  successful: boolean,
): Promise<void> {
  try {
    await sql`
      INSERT INTO login_attempts (identifier, ip_address, successful)
      VALUES (${identifier.trim().toLowerCase()}, ${ip}, ${successful})
    `
  } catch (error) {
    console.error("[Oran sınırlama] Deneme kaydedilemedi:", error)
  }
}

/** Başarılı girişten sonra o hesabın başarısız deneme geçmişini temizler. */
export async function clearFailedAttempts(identifier: string): Promise<void> {
  try {
    await sql`
      DELETE FROM login_attempts
      WHERE identifier = ${identifier.trim().toLowerCase()} AND successful = false
    `
  } catch (error) {
    console.error("[Oran sınırlama] Geçmiş temizlenemedi:", error)
  }
}
