/**
 * Uygulamanın dış adresini döndürür (davet ve şifre sıfırlama bağlantıları
 * için kullanılır — yalnızca sunucu tarafında).
 *
 * Öncelik sırası:
 *  1. APP_URL          — çalışma zamanında okunur; değişince yeniden derleme
 *                        GEREKMEZ, sadece uygulamayı yeniden başlatmak yeter.
 *  2. NEXT_PUBLIC_APP_URL — eski kurulumlarla uyumluluk için (derleme anında
 *                        gömülür; değişince yeniden derleme gerekir).
 *  3. VERCEL_URL       — Vercel dağıtımlarında otomatik gelir.
 *  4. http://localhost:3000 — yerel geliştirme.
 */
export function getAppUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
}
