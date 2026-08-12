/**
 * Bir kullanıcıyı süper yönetici yapar (veya geri alır).
 *
 * Süper yönetici sistemdeki TÜM şirketleri görür ve yönetir.
 *
 * Kullanım:
 *   node scripts/superadmin.mjs ornek@sirket.com          # yetki ver
 *   node scripts/superadmin.mjs ornek@sirket.com --off     # yetkiyi al
 *   node scripts/superadmin.mjs --list                     # süper yöneticileri listele
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import postgres from "postgres"

// .env.local dosyasını yükle (varsa)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envPath = path.join(root, ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("=")
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (!(key in process.env)) process.env[key] = val
  }
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error("HATA: DATABASE_URL tanımlı değil (.env.local dosyasını kontrol edin).")
  process.exit(1)
}

const args = process.argv.slice(2)
const list = args.includes("--list")
const off = args.includes("--off")
const email = args.find((a) => !a.startsWith("--"))

const sql = postgres(url, {
  max: 1,
  ssl: /sslmode=require|sslmode=verify/.test(url) ? "require" : false,
  onnotice: () => {},
})

try {
  if (list) {
    const rows = await sql`SELECT email, name FROM users WHERE is_super_admin = true ORDER BY email`
    if (rows.length === 0) {
      console.log("Henüz süper yönetici yok.")
    } else {
      console.log("Süper yöneticiler:")
      for (const r of rows) console.log(`  - ${r.email}${r.name ? ` (${r.name})` : ""}`)
    }
    process.exit(0)
  }

  if (!email) {
    console.error("Kullanım: node scripts/superadmin.mjs <email> [--off]")
    console.error("          node scripts/superadmin.mjs --list")
    process.exit(1)
  }

  const value = !off
  const result = await sql`
    UPDATE users SET is_super_admin = ${value}
    WHERE lower(email) = ${email.toLowerCase()}
    RETURNING email, is_super_admin
  `

  if (result.length === 0) {
    console.error(`HATA: '${email}' e-postalı kullanıcı bulunamadı.`)
    process.exit(1)
  }

  if (value) {
    console.log(`✓ ${result[0].email} artık SÜPER YÖNETİCİ — tüm şirketleri görebilir.`)
  } else {
    console.log(`✓ ${result[0].email} süper yöneticilikten çıkarıldı.`)
  }
} finally {
  await sql.end()
}
