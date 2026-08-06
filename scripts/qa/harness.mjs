/**
 * Canlı API entegrasyon testi altyapısı (Node fetch tabanlı).
 *
 * Uygulama http://localhost:3000 üzerinde çalışıyor olmalıdır.
 * Kullanım: node scripts/qa/harness.mjs
 */

const BASE = process.env.BASE_URL || "http://localhost:3000"

/* ---- basit çerez saklayan istemci ---- */
export function newClient(label = "client") {
  return { label, cookies: new Map() }
}

function cookieHeader(client) {
  return [...client.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
}

function storeCookies(client, res) {
  const raw = res.headers.getSetCookie?.() ?? []
  for (const line of raw) {
    const [pair] = line.split(";")
    const idx = pair.indexOf("=")
    if (idx > 0) client.cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim())
  }
}

export async function api(client, method, path, body, extraHeaders = {}) {
  const headers = { ...extraHeaders }
  const cookie = cookieHeader(client)
  if (cookie) headers.Cookie = cookie
  if (body !== undefined) headers["Content-Type"] = "application/json"

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  })
  storeCookies(client, res)

  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: res.status, data, headers: res.headers }
}

export async function login(client, email, password) {
  const r = await api(client, "POST", "/api/auth/signin", { email, password })
  return r.status === 200
}

/* ---- test kaydı ---- */
export const results = { pass: 0, fail: 0, items: [] }

export function check(name, condition, detail = "") {
  const ok = !!condition
  if (ok) results.pass++
  else results.fail++
  results.items.push({ name, ok, detail })
  const mark = ok ? "✅" : "❌"
  console.log(`  ${mark} ${name}${detail ? `  — ${detail}` : ""}`)
  return ok
}

export function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`)
}

export function summary() {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`SONUÇ: ${results.pass} geçti, ${results.fail} kaldı`)
  if (results.fail > 0) {
    console.log("\nBAŞARISIZLAR:")
    for (const it of results.items.filter((i) => !i.ok)) {
      console.log(`  ❌ ${it.name}${it.detail ? `  — ${it.detail}` : ""}`)
    }
  }
  console.log("=".repeat(60))
  return results.fail === 0
}
