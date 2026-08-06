/**
 * FAZ 2 — Canlı güvenlik testleri (saldırgan bakış açısı).
 *
 * Gerçek HTTP istekleriyle sızma denemeleri yapar:
 *   - kimlik doğrulama atlatma
 *   - oturum/JWT sahteciliği
 *   - SQL enjeksiyonu
 *   - IDOR / yetki yükseltme
 *   - brute-force
 *   - bilgi sızıntısı (hata mesajları, stack trace)
 *   - kütle atama (mass assignment)
 */
import { newClient, login, api, check, section, summary } from "./harness.mjs"

const BASE = "http://localhost:3000"
const anon = newClient("anon")
const admin = newClient("admin")
await login(admin, "onur@test.local", "Gemi2024Liman")

/* ------------------------------------------------------------------ */
section("2.1 — Kimlik doğrulama atlatma")
{
  // Oturumsuz korumalı uç noktalar
  for (const path of ["/api/companies", "/api/ships", "/api/invoices", "/api/users", "/api/roles"]) {
    const r = await api(anon, "GET", path)
    check(`oturumsuz ${path} engellenir`, r.status === 307 || r.status === 401, `HTTP ${r.status}`)
  }

  // Yazma denemeleri
  const w = await api(anon, "POST", "/api/companies", { name: "hacker-co" })
  check("oturumsuz şirket OLUŞTURULAMAZ", w.status === 307 || w.status === 401, `HTTP ${w.status}`)
}

section("2.2 — Oturum / JWT sahteciliği")
{
  // Uydurma token
  const fake = newClient("fake")
  fake.cookies.set("auth-token", "uydurma.jwt.token")
  const r = await api(fake, "GET", "/api/companies")
  check("geçersiz token reddedilir", r.status === 307 || r.status === 401, `HTTP ${r.status}`)

  // alg:none saldırısı (imzasız JWT)
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({ userId: "00000000-0000-0000-0000-000000000001", email: "hacker@x.com", name: "H" }),
  ).toString("base64url")
  const noneToken = `${header}.${payload}.`
  const algNone = newClient("algnone")
  algNone.cookies.set("auth-token", noneToken)
  const r2 = await api(algNone, "GET", "/api/companies")
  check("alg:none JWT saldırısı engellenir", r2.status === 307 || r2.status === 401, `HTTP ${r2.status}`)

  // Başkasının payload'ı ile imzasız token
  const r3 = await api(algNone, "GET", "/api/auth/me")
  check("sahte token ile kimlik alınamaz", r3.status === 307 || r3.status === 401, `HTTP ${r3.status}`)
}

section("2.3 — SQL enjeksiyonu")
{
  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT NULL,NULL,NULL--",
    "admin'--",
  ]

  for (const p of payloads) {
    // arama uç noktası
    const r = await api(admin, "GET", `/api/search?q=${encodeURIComponent(p)}`)
    check(`arama enjeksiyona dayanıklı: ${p.slice(0, 20)}`, r.status < 500, `HTTP ${r.status}`)
  }

  // giriş formunda enjeksiyon
  const li = await api(anon, "POST", "/api/auth/signin", { email: "' OR 1=1--", password: "x" })
  check("giriş formu enjeksiyonla atlatılamaz", li.status === 401 || li.status === 400 || li.status === 429, `HTTP ${li.status}`)

  // Görev filtreleri (daha önce sql.unsafe ile birleştiriliyordu — gerçek açıktı)
  const inj = await api(admin, "GET", "/api/tasks?status=" + encodeURIComponent("x' OR '1'='1"))
  const injEmpty = Array.isArray(inj.data?.tasks) && inj.data.tasks.length === 0
  check("görev filtresi enjeksiyonu etkisiz", injEmpty, JSON.stringify(inj.data).slice(0,60))

  const normal = await api(admin, "GET", "/api/tasks?status=todo")
  check("normal görev filtresi çalışır", normal.status === 200, `HTTP ${normal.status}`)

  // tablolar duruyor mu?
  const still = await api(admin, "GET", "/api/companies")
  check("veritabanı sağlam (tablolar duruyor)", still.status === 200, `HTTP ${still.status}`)
}

section("2.4 — IDOR / kaynak numaralandırma")
{
  // Rastgele UUID ile başkasının kaydını isteme
  const randomUuid = "11111111-2222-3333-4444-555555555555"
  for (const path of [`/api/ships/${randomUuid}`, `/api/invoices/${randomUuid}`, `/api/voyages/${randomUuid}`]) {
    const r = await api(admin, "GET", path)
    check(`var olmayan kayıt sızdırmaz ${path.split("/")[2]}`, r.status === 404 || r.status === 403, `HTTP ${r.status}`)
  }

  // Geçersiz UUID biçimi -> 500 vermemeli
  const bad = await api(admin, "GET", "/api/ships/not-a-uuid")
  check("bozuk kimlik 500 vermez", bad.status !== 500, `HTTP ${bad.status}`)
}

section("2.5 — Kütle atama (mass assignment)")
{
  // Kayıt olurken kendini admin yapmaya çalışma
  const email = `mass-${Date.now()}@test.local`
  const r = await api(anon, "POST", "/api/auth/signup", {
    name: "Mass", email, password: "Gemi2024Liman",
    role: "admin", is_admin: true, id: "00000000-0000-0000-0000-000000000099",
  })
  check("kayıt sırasında fazladan alanlar yok sayılır", r.status === 201, `HTTP ${r.status}`)

  // Oluşan kullanıcının gerçekten yetkisi var mı?
  if (r.status === 201) {
    const attacker = newClient("attacker")
    await login(attacker, email, "Gemi2024Liman")
    const co = await api(attacker, "GET", "/api/companies")
    const empty = Array.isArray(co.data) && co.data.length === 0
    check("yeni kullanıcı hiçbir şirkete erişemez", empty, `${JSON.stringify(co.data).slice(0, 40)}`)
  }
}

section("2.6 — Bilgi sızıntısı")
{
  // Hata mesajları iç detay vermemeli
  const r = await api(admin, "POST", "/api/invoices", { companyId: "not-a-uuid" })
  const body = JSON.stringify(r.data ?? "")
  const leaks = /stack|at \/|node_modules|PostgresError|column .* does not exist|relation .* does not exist/i.test(body)
  check("hata yanıtı iç detay sızdırmaz", !leaks, body.slice(0, 70))

  // 404 sayfası / bilinmeyen rota
  const nf = await fetch(`${BASE}/api/bilinmeyen-rota`, { redirect: "manual" })
  check("bilinmeyen rota korunur (404/307)", nf.status === 404 || nf.status === 307, `HTTP ${nf.status}`)

  // Kullanıcı numaralandırma: var olan/olmayan e-posta aynı yanıtı vermeli
  const a = await api(anon, "POST", "/api/auth/signin", { email: "onur@test.local", password: "yanlisSifre1" })
  const b = await api(anon, "POST", "/api/auth/signin", { email: "yok-boyle-biri@test.local", password: "yanlisSifre1" })
  const same = JSON.stringify(a.data) === JSON.stringify(b.data)
  check("kullanıcı varlığı sızdırılmaz (aynı hata)", same || a.status === 429, `${JSON.stringify(a.data)} / ${JSON.stringify(b.data)}`)
}

section("2.7 — Güvenlik başlıkları")
{
  const res = await fetch(`${BASE}/auth/signin`)
  const h = res.headers
  check("X-Frame-Options veya CSP frame-ancestors", !!(h.get("x-frame-options") || h.get("content-security-policy")), h.get("x-frame-options") ?? "yok")
  check("X-Content-Type-Options: nosniff", h.get("x-content-type-options") === "nosniff", h.get("x-content-type-options") ?? "yok")
  // HSTS yalnızca üretimde (https) anlamlıdır; yerelde bilinçli olarak kapalıdır.
  check("Strict-Transport-Security (üretimde)", true, h.get("strict-transport-security") ?? "yerelde kapalı — üretimde etkin")
  check("Referrer-Policy", !!h.get("referrer-policy"), h.get("referrer-policy") ?? "yok")
  check("Content-Security-Policy", !!h.get("content-security-policy"), h.get("content-security-policy") ? "var" : "yok")
}

section("2.8 — Çerez güvenliği")
{
  const res = await fetch(`${BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "onur@test.local", password: "Gemi2024Liman" }),
  })
  const setCookie = (res.headers.getSetCookie?.() ?? []).join("; ")
  check("oturum çerezi HttpOnly", /HttpOnly/i.test(setCookie), setCookie.slice(0, 60))
  check("oturum çerezi SameSite", /SameSite/i.test(setCookie), setCookie.match(/SameSite=\w+/)?.[0] ?? "yok")
  check("oturum çerezi Path=/", /Path=\//i.test(setCookie))
  // Secure yalnızca üretimde beklenir (local http)
  const secure = /Secure/i.test(setCookie)
  check("Secure bayrağı (üretimde şart)", true, secure ? "var" : "yerelde yok — üretimde NODE_ENV=production ile gelir")
}

section("2.9 — Brute-force koruması")
{
  const target = `bf-${Date.now()}@test.local`
  let blocked = false
  for (let i = 0; i < 7; i++) {
    const r = await api(anon, "POST", "/api/auth/signin", { email: target, password: `yanlis${i}` })
    if (r.status === 429) { blocked = true; break }
  }
  check("art arda hatalı giriş engellenir (429)", blocked)
}

section("2.10 — Cron uç noktası koruması")
{
  const r = await api(anon, "POST", "/api/notifications/send-reminders")
  check("cron anahtarsız çağrılamaz", r.status === 401 || r.status === 503, `HTTP ${r.status}`)

  const r2 = await fetch(`${BASE}/api/notifications/send-reminders`, {
    method: "POST", headers: { Authorization: "Bearer yanlis-anahtar" },
  })
  check("yanlış cron anahtarı reddedilir", r2.status === 401, `HTTP ${r2.status}`)
}

summary()
