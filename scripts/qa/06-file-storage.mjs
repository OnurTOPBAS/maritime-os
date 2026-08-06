/**
 * FAZ 2b — Yerel dosya depolama testi.
 *
 * Dosyalar Vercel Blob yerine sunucu diskinde tutuluyor. Bu test:
 *   - dosyanın yüklenip kimlik doğrulamalı adresten indirilebildiğini
 *   - OTURUMSUZ erişimin engellendiğini (gizlilik hedefi)
 *   - yol geçişi (path traversal) saldırısının etkisiz olduğunu
 * doğrular.
 */
import { newClient, login, api, check, section, summary } from "./harness.mjs"

const BASE = "http://localhost:3000"
const admin = newClient("admin")
await login(admin, "onur@test.local", "Gemi2024Liman")

const cookie = [...admin.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ")

section("FAZ 2b — Dosya yükleme ve gizlilik")

// Yükleme (multipart) — harness JSON gönderdiği için fetch ile elle
const form = new FormData()
form.append("file", new Blob(["gizli denizcilik verisi"], { type: "application/pdf" }), "rapor.pdf")
const up = await fetch(`${BASE}/api/upload`, { method: "POST", headers: { Cookie: cookie }, body: form })
const upData = await up.json()
check("dosya yüklenir", up.status === 200 && !!upData.url, `HTTP ${up.status}`)

const fileUrl = upData.url

// Depolama adresi Vercel değil, kendi sunucumuz
check("adres kendi sunucumuzda (Vercel değil)", fileUrl?.startsWith("/api/files/"), fileUrl)

// Giriş yapmış kullanıcı indirebilir
const authed = await fetch(`${BASE}${fileUrl}`, { headers: { Cookie: cookie }, redirect: "manual" })
const content = await authed.text()
check("giriş yapan kullanıcı indirebilir", authed.status === 200 && content.includes("gizli"), `HTTP ${authed.status}`)

// OTURUMSUZ erişim engellenir — en kritik gizlilik kontrolü
const anon = await fetch(`${BASE}${fileUrl}`, { redirect: "manual" })
check("OTURUMSUZ erişim engellenir", anon.status === 307 || anon.status === 401, `HTTP ${anon.status}`)

section("FAZ 2b — Yol geçişi (path traversal) saldırısı")
for (const attack of [
  "/api/files/..%2F..%2F..%2Fetc%2Fpasswd",
  "/api/files/uploads%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd",
]) {
  const r = await fetch(`${BASE}${attack}`, { headers: { Cookie: cookie }, redirect: "manual" })
  const body = await r.text()
  const safe = (r.status === 404 || r.status === 403) && !body.includes("root:")
  check(`yol geçişi etkisiz: ${attack.slice(11, 40)}`, safe, `HTTP ${r.status}`)
}

summary()
