/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production"

/**
 * İçerik Güvenlik Politikası (CSP).
 *
 * Next.js çalışma zamanı satır içi (inline) script kullanır, bu yüzden
 * 'unsafe-inline' gereklidir. 'unsafe-eval' yalnızca geliştirme modunda
 * (hot reload) gerekir; üretimde kaldırılır.
 *
 * Yüklenen dosyalar Vercel Blob üzerinde barındığı için görsel kaynaklarına
 * blob ve https izni verilir. Kendi sunucunuza geçince bu liste daraltılmalıdır.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'", // clickjacking koruması
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

/**
 * Tüm yanıtlara uygulanan güvenlik başlıkları.
 * Önceden hiçbiri tanımlı değildi; tarayıcı tarafı korumaların tamamı kapalıydı.
 */
const securityHeaders = [
  // Sayfanın iframe içine gömülmesini engeller (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Tarayıcının içerik türünü tahmin etmesini engeller (MIME sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Dış sitelere tam URL (ve olası kimlikler) sızmasını engeller.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kullanılmayan tarayıcı yeteneklerini kapatır.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: csp },
  // HTTPS zorlaması. Yalnızca üretimde anlamlıdır; yerelde http kullanılır.
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
]

const nextConfig = {
  // Tip hataları artık gizlenmiyor: hatalı tip üretim derlemesini durdurur.
  // (Önceden ignoreBuildErrors: true ile 167 hata sessizce yok sayılıyordu.)
  images: {
    unoptimized: true,
  },

  // Sunucu tarafı hata ayıklama izlerinin yanıt başlıklarına düşmesini önler.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
