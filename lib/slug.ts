/**
 * Metinden kod tarafında kullanılabilir sabit tanımlayıcı (slug) üretir.
 *
 * Rol adları kullanıcı tarafından değiştirilebilir; yetki eşlemesi ada değil
 * slug'a bağlanır. Bu sayede "Operasyon Müdürü" adı sonradan düzeltilse bile
 * o role atanmış izinler bozulmaz.
 */

/** Türkçe karakterleri ASCII karşılıklarına indirger. */
const TURKISH_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
}

export function slugify(value: string): string {
  const ascii = value
    .split("")
    .map((ch) => TURKISH_MAP[ch] ?? ch)
    .join("")

  return ascii
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // aksanları at
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_") // harf/rakam dışını alt çizgiye çevir
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50)
}

/**
 * Kullanımda olan slug'lar arasında benzersiz bir slug üretir.
 * Çakışma varsa sonuna sayı eklenir: rol, rol_2, rol_3 ...
 */
export function uniqueSlug(value: string, taken: Iterable<string>): string {
  const base = slugify(value) || "rol"
  const used = new Set(taken)

  if (!used.has(base)) return base

  for (let i = 2; i < 1000; i++) {
    const candidate = `${base.slice(0, 46)}_${i}`
    if (!used.has(candidate)) return candidate
  }

  // Pratikte ulaşılmaz; yine de benzersizlik garanti edilir.
  return `${base.slice(0, 40)}_${Date.now().toString(36)}`
}
