/**
 * Test ortamı hazırlığı.
 *
 * .env.local dosyasındaki değişkenleri yükler; böylece testler geliştirme
 * ortamıyla aynı veritabanına ve ayarlara erişir.
 */

import fs from "node:fs"
import path from "node:path"

const envPath = path.resolve(process.cwd(), ".env.local")

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const eq = trimmed.indexOf("=")
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()

    // Tırnak işaretlerini kaldır
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
