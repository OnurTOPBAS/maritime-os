/**
 * Bir kullanıcının şifresini komut satırından sıfırlar.
 *
 * Şifreler bcrypt ile saklanır (geri okunamaz); bu yüzden "unutulan şifreyi
 * görmek" mümkün değildir — yenisini belirleriz.
 *
 * Kullanım:
 *   node scripts/reset-password.mjs ornek@sirket.com YeniSifre123
 *   node scripts/reset-password.mjs --list          # kullanıcıları listele
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import postgres from "postgres"
import bcrypt from "bcryptjs"

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
  console.error("HATA: DATABASE_URL tanımlı değil (.env.local).")
  process.exit(1)
}

const args = process.argv.slice(2)
const sql = postgres(url, { max: 1, ssl: /sslmode=require|verify/.test(url) ? "require" : false, onnotice: () => {} })

try {
  if (args.includes("--list")) {
    const rows = await sql`SELECT email, name FROM users ORDER BY email`
    console.log("Kullanıcılar:")
    for (const r of rows) console.log(`  - ${r.email}${r.name ? ` (${r.name})` : ""}`)
    process.exit(0)
  }

  const email = args[0]
  const newPassword = args[1]
  if (!email || !newPassword) {
    console.error("Kullanım: node scripts/reset-password.mjs <email> <yeni-sifre>")
    console.error("          node scripts/reset-password.mjs --list")
    process.exit(1)
  }
  if (newPassword.length < 8) {
    console.error("HATA: Şifre en az 8 karakter olmalı.")
    process.exit(1)
  }

  const hash = await bcrypt.hash(newPassword, 12)
  const result = await sql`
    UPDATE users SET password_hash = ${hash}, updated_at = NOW()
    WHERE lower(email) = ${email.toLowerCase()}
    RETURNING email
  `
  if (result.length === 0) {
    console.error(`HATA: '${email}' e-postalı kullanıcı bulunamadı.`)
    process.exit(1)
  }
  console.log(`✓ ${result[0].email} şifresi güncellendi. Yeni şifre: ${newPassword}`)
} finally {
  await sql.end()
}
