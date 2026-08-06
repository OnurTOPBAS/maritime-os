/**
 * FAZ 1c — RBAC yetki zorlaması (API düzeyinde).
 *
 * Soru: "Yetki atadığım kişi GERÇEKTEN sadece atadığım yetkileri mi
 * kullanabiliyor?" Bunu doğrudan HTTP istekleriyle kanıtlar.
 *
 * Kurgu:
 *   - admin bir şirket + filo + gemi oluşturur
 *   - üç ayrı kullanıcı oluşturulur ve farklı rollerle ekibe eklenir:
 *       viewer            -> yalnızca görüntüleme
 *       finance_manager   -> fatura yönetir, gemi silemez
 *       technical_manager -> gemi yönetir, faturaya erişemez
 *   - her kullanıcının yetkisi dışındaki işlemi denemesi 403 almalı,
 *     yetkisi içindeki işlem başarılı olmalı
 */
import { newClient, login, api, check, section, summary } from "./harness.mjs"
import { execSync } from "node:child_process"

const PSQL = "/Applications/Postgres.app/Contents/Versions/latest/bin/psql"
const DB = "postgres://onur@localhost:5432/fidelity_denizcilik"
// -tAc ile RETURNING bazen "INSERT 0 1" satırını da yazar; son boş olmayan
// satırı alarak yalnızca değeri döndürürüz.
const q = (sql) => {
  const out = execSync(`${PSQL} "${DB}" -tAc "${sql.replace(/"/g, '\\"')}"`, { encoding: "utf8" })
  const lines = out.split("\n").map((l) => l.trim()).filter((l) => l && !/^INSERT \d/.test(l))
  return lines[lines.length - 1] ?? ""
}

const admin = newClient("admin")
if (!(await login(admin, "onur@test.local", "Gemi2024Liman"))) {
  console.error("admin girişi başarısız"); process.exit(1)
}

const tag = `rbac-${Date.now()}`
const pw = "Gemi2024Liman"

/* -- admin altyapıyı kurar -- */
const co = await api(admin, "POST", "/api/companies", { name: `${tag} Co` })
const companyId = co.data.id
const fl = await api(admin, "POST", "/api/fleets", { company_id: companyId, name: `${tag} Fleet` })
const fleetId = fl.data.fleet.id
const sh = await api(admin, "POST", "/api/ships", {
  fleet_id: fleetId, name: `${tag} Ship`, imo_number: `IMO${Math.floor(1000000 + Math.random() * 8999999)}`,
})
const shipId = sh.data.ship.id

/* -- rol başına kullanıcı oluştur (admin'in kendi API'siyle) ve ekibe ekle --
   Uygulamanın /api/users uç noktası kullanıcıyı oluşturur, parolayı doğru
   hashler ve user_permissions kaydını ilgili rolle ekler. Ham SQL yerine bu
   kullanılır (gerçekçi + hash bozulması riski yok). */
const users = {}
for (const role of ["viewer", "finance_manager", "technical_manager"]) {
  const email = `${role}-${tag}@test.local`
  const res = await api(admin, "POST", "/api/users", {
    name: role, email, password: pw, role, companyId,
  })
  const uid = q(`SELECT id FROM users WHERE email='${email}'`)
  const client = newClient(role)
  const ok = await login(client, email, pw)
  users[role] = { uid, email, client, loginOk: ok, createStatus: res.status }
}

section("FAZ 1c — Kullanıcı girişleri")
for (const [role, u] of Object.entries(users)) {
  check(`${role} giriş yapabiliyor`, u.loginOk)
}

section("FAZ 1c — Viewer: yalnızca okuma")
{
  const c = users.viewer.client
  const view = await api(c, "GET", `/api/ships/${shipId}`)
  check("viewer gemiyi görüntüleyebilir", view.status === 200, `HTTP ${view.status}`)

  const edit = await api(c, "PUT", `/api/ships/${shipId}`, { name: "viewer-degistirdi" })
  check("viewer gemiyi DÜZENLEYEMEZ (403)", edit.status === 403, `HTTP ${edit.status}`)

  const del = await api(c, "DELETE", `/api/ships/${shipId}`)
  check("viewer gemiyi SİLEMEZ (403)", del.status === 403, `HTTP ${del.status}`)

  const inv = await api(c, "POST", "/api/invoices", {
    companyId, invoiceNumber: `${tag}-vX`, invoiceType: "freight", type: "income",
    amount: 1, currency: "USD", invoiceDate: "2026-01-01", status: "pending",
  })
  check("viewer fatura OLUŞTURAMAZ (403)", inv.status === 403, `HTTP ${inv.status}`)
}

section("FAZ 1c — Finance Manager: fatura evet, gemi hayır")
{
  const c = users.finance_manager.client
  const inv = await api(c, "POST", "/api/invoices", {
    companyId, invoiceNumber: `${tag}-fin`, invoiceType: "freight", type: "income",
    amount: 5000, currency: "USD", invoiceDate: "2026-01-01", status: "pending",
  })
  check("finance fatura OLUŞTURABİLİR", inv.status === 201 || inv.status === 200, `HTTP ${inv.status}`)

  const view = await api(c, "GET", `/api/ships/${shipId}`)
  check("finance gemiyi görüntüleyebilir", view.status === 200, `HTTP ${view.status}`)

  const del = await api(c, "DELETE", `/api/ships/${shipId}`)
  check("finance gemiyi SİLEMEZ (403)", del.status === 403, `HTTP ${del.status}`)

  const edit = await api(c, "PUT", `/api/ships/${shipId}`, { name: "finance-degistirdi" })
  check("finance gemiyi DÜZENLEYEMEZ (403)", edit.status === 403, `HTTP ${edit.status}`)
}

section("FAZ 1c — Technical Manager: gemi evet, fatura hayır")
{
  const c = users.technical_manager.client
  const edit = await api(c, "PUT", `/api/ships/${shipId}`, { name: `${tag}-tech-guncel` })
  check("technical gemiyi DÜZENLEYEBİLİR", edit.status === 200, `HTTP ${edit.status}`)

  const inv = await api(c, "POST", "/api/invoices", {
    companyId, invoiceNumber: `${tag}-tech`, invoiceType: "freight", type: "income",
    amount: 1, currency: "USD", invoiceDate: "2026-01-01", status: "pending",
  })
  check("technical fatura OLUŞTURAMAZ (403)", inv.status === 403, `HTTP ${inv.status}`)
}

section("FAZ 1c — Yetki yükseltme denemesi")
{
  // viewer kendini admin yapmaya çalışıyor (ekibe kendini admin ekleme)
  const c = users.viewer.client
  const esc = await api(c, "POST", `/api/companies/${companyId}/team`, {
    userId: users.viewer.uid, role: "admin",
  })
  check("viewer kendini admin EKLEYEMEZ (403)", esc.status === 403, `HTTP ${esc.status}`)
}

/* -- temizlik -- */
section("FAZ 1c — Temizlik")
{
  const r = await api(admin, "DELETE", `/api/companies/${companyId}`)
  check("şirket ve bağlı kayıtlar silindi", r.status === 200, `HTTP ${r.status}`)
  for (const u of Object.values(users)) q(`DELETE FROM users WHERE id='${u.uid}'`)
  check("test kullanıcıları temizlendi", true)
}

summary()
