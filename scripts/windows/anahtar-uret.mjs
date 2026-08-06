/**
 * Üretim için güvenli rastgele anahtarlar üretir.
 * Windows'ta openssl olmayabileceği için Node ile yapılır.
 *
 * Kullanım:  node scripts/windows/anahtar-uret.mjs
 */
import crypto from "node:crypto"

console.log("")
console.log("Aşağıdaki değerleri .env.local dosyanıza yapıştırın:")
console.log("(her kurulumda YENİ üretin, kimseyle paylaşmayın)")
console.log("")
console.log(`JWT_SECRET="${crypto.randomBytes(48).toString("hex")}"`)
console.log(`CRON_SECRET="${crypto.randomBytes(32).toString("hex")}"`)
console.log("")
