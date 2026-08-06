/**
 * Veritabanı kurulum/güncelleme betiği (işletim sisteminden bağımsız).
 *
 * scripts/*.sql dosyalarını sıra numarasına göre çalıştırır. Uygulamanın kendi
 * bağlantısını (DATABASE_URL) kullanır; ayrıca psql kurmak gerekmez. Windows,
 * Linux ve macOS'ta aynı şekilde çalışır.
 *
 * Tüm migration'lar idempotenttir (IF NOT EXISTS / DROP ... IF EXISTS), yani
 * bu betiği istediğiniz kadar tekrar çalıştırabilirsiniz — var olan veriye
 * dokunmaz, yalnızca eksik yapıları tamamlar.
 *
 * Kullanım:
 *   npm run migrate
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
    let val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (!(key in process.env)) process.env[key] = val
  }
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error("HATA: DATABASE_URL tanımlı değil (.env.local dosyasını kontrol edin).")
  process.exit(1)
}

const scriptsDir = path.join(root, "scripts")

// Yalnızca .sql dosyaları; .superseded ve diğerleri atlanır. Sürüm sırasına göre.
const files = fs
  .readdirSync(scriptsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => {
    const na = parseInt(a, 10)
    const nb = parseInt(b, 10)
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb
    return a.localeCompare(b)
  })

console.log(`${files.length} migration dosyası bulundu.\n`)

const sql = postgres(url, {
  max: 1,
  ssl: /sslmode=require|sslmode=verify/.test(url) ? "require" : false,
  onnotice: () => {},
})

let ok = 0
let fail = 0

try {
  for (const file of files) {
    const content = fs.readFileSync(path.join(scriptsDir, file), "utf8")
    try {
      await sql.unsafe(content)
      console.log(`  ✓ ${file}`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${file}`)
      console.error(`      ${String(err.message).split("\n")[0]}`)
      fail++
    }
  }
} finally {
  await sql.end()
}

console.log(`\n${"─".repeat(50)}`)
console.log(`${ok} başarılı, ${fail} hatalı`)
if (fail > 0) {
  console.log("\nNot: Migration'lar idempotenttir. Bir hata ilk kez görülüyorsa")
  console.log("içeriğe bakın; tekrar çalıştırmada 'already exists' hataları normaldir.")
  process.exit(1)
}
console.log("Veritabanı hazır.")
