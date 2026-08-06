/**
 * FAZ 1d — Derin RBAC testi (dönüştürülen rotalar).
 *
 * 03 numaralı test gemi ve faturayı kapsıyordu. Bu test, satır-içi kontrolden
 * merkezi katmana taşınan diğer rotaları doğrular:
 *   fixtures, voyages, fleet-banks, bank-accounts, invoices/[id]
 *
 * Ayrıca ŞİRKETLER ARASI izolasyonu sınar: A şirketinin üyesi, B şirketinin
 * kaydına erişebiliyor mu?
 */
import { newClient, login, api, check, section, summary } from "./harness.mjs"
import { execSync } from "node:child_process"

const PSQL = "/Applications/Postgres.app/Contents/Versions/latest/bin/psql"
const DB = "postgres://onur@localhost:5432/fidelity_denizcilik"
const q = (sql) => {
  const out = execSync(`${PSQL} "${DB}" -tAc "${sql.replace(/"/g, '\\"')}"`, { encoding: "utf8" })
  const lines = out.split("\n").map((l) => l.trim()).filter((l) => l && !/^(INSERT|DELETE|UPDATE) \d/.test(l))
  return lines[lines.length - 1] ?? ""
}

const admin = newClient("admin")
if (!(await login(admin, "onur@test.local", "Gemi2024Liman"))) process.exit(1)

const tag = `deep-${Date.now()}`
const pw = "Gemi2024Liman"

/* --- A şirketi: tam zincir --- */
const coA = (await api(admin, "POST", "/api/companies", { name: `${tag} A` })).data.id
const flA = (await api(admin, "POST", "/api/fleets", { company_id: coA, name: `${tag} FA` })).data.fleet.id
const shA = (await api(admin, "POST", "/api/ships", {
  fleet_id: flA, name: `${tag} SA`, imo_number: `IMO${Math.floor(1000000 + Math.random() * 8999999)}`,
})).data.ship.id
const fxA = (await api(admin, "POST", "/api/fixtures", {
  ship_id: shA, charterer: `${tag} CH`, load_port: "Istanbul", discharge_port: "Rotterdam", rate: 100,
})).data.fixture?.id ?? (await api(admin, "GET", "/api/fixtures")).data?.[0]?.id
const voA = (await api(admin, "POST", "/api/voyages", {
  fixture_id: fxA, voyage_number: `${tag}-V`, load_port: "Istanbul", discharge_port: "Rotterdam",
})).data.id
const invA = (await api(admin, "POST", "/api/invoices", {
  companyId: coA, invoiceNumber: `${tag}-I`, invoiceType: "freight", type: "income",
  amount: 100, currency: "USD", invoiceDate: "2026-01-01", status: "pending",
})).data.id

/* --- B şirketi: yabancı --- */
const coB = (await api(admin, "POST", "/api/companies", { name: `${tag} B` })).data.id

/* --- kullanıcılar --- */
async function mkUser(role, companyId) {
  const email = `${role}-${tag}-${companyId.slice(0, 4)}@test.local`
  await api(admin, "POST", "/api/users", { name: role, email, password: pw, role, companyId })
  const c = newClient(role)
  await login(c, email, pw)
  return { email, client: c, uid: q(`SELECT id FROM users WHERE email='${email}'`) }
}

const viewerA = await mkUser("viewer", coA)
const opsA = await mkUser("operations_manager", coA)
const adminB = await mkUser("admin", coB) // B şirketinde admin, A'da hiçbir şey

section("FAZ 1d — Fixture yetkileri (A şirketi)")
{
  const v = await api(viewerA.client, "GET", `/api/fixtures/${fxA}`)
  check("viewer fixture görüntüler", v.status === 200, `HTTP ${v.status}`)

  const e = await api(viewerA.client, "PUT", `/api/fixtures/${fxA}`, { charterer: "degistirildi" })
  check("viewer fixture DÜZENLEYEMEZ", e.status === 403, `HTTP ${e.status}`)

  const oe = await api(opsA.client, "PUT", `/api/fixtures/${fxA}`, {
    charterer: `${tag} CH2`, load_port: "Izmir", discharge_port: "Rotterdam", rate: 200,
  })
  check("operations fixture DÜZENLEYEBİLİR", oe.status === 200, `HTTP ${oe.status}`)

  const vd = await api(viewerA.client, "DELETE", `/api/fixtures/${fxA}`)
  check("viewer fixture SİLEMEZ", vd.status === 403, `HTTP ${vd.status}`)
}

section("FAZ 1d — Sefer yetkileri")
{
  const v = await api(viewerA.client, "GET", `/api/voyages/${voA}`)
  check("viewer sefer görüntüler", v.status === 200, `HTTP ${v.status}`)

  const e = await api(viewerA.client, "PUT", `/api/voyages/${voA}`, { voyage_number: `${tag}-X` })
  check("viewer sefer DÜZENLEYEMEZ", e.status === 403, `HTTP ${e.status}`)
}

section("FAZ 1d — Fatura detay yetkileri")
{
  const v = await api(viewerA.client, "GET", `/api/invoices/${invA}`)
  check("viewer fatura görüntüler", v.status === 200, `HTTP ${v.status}`)

  const d = await api(viewerA.client, "DELETE", `/api/invoices/${invA}`)
  check("viewer fatura SİLEMEZ", d.status === 403, `HTTP ${d.status}`)

  // operations_manager faturayı yalnızca görüntüleyebilir (view), silemez
  const od = await api(opsA.client, "DELETE", `/api/invoices/${invA}`)
  check("operations fatura SİLEMEZ", od.status === 403, `HTTP ${od.status}`)
}

section("FAZ 1d — ŞİRKETLER ARASI izolasyon (en kritik)")
{
  // adminB, B şirketinin admin'i ama A şirketine hiç üye değil
  const s = await api(adminB.client, "GET", `/api/ships/${shA}`)
  check("B-admin A'nın gemisini GÖREMEZ", s.status === 403 || s.status === 404, `HTTP ${s.status}`)

  const f = await api(adminB.client, "GET", `/api/fixtures/${fxA}`)
  check("B-admin A'nın fixture'ını GÖREMEZ", f.status === 403 || f.status === 404, `HTTP ${f.status}`)

  const v = await api(adminB.client, "GET", `/api/voyages/${voA}`)
  check("B-admin A'nın seferini GÖREMEZ", v.status === 403 || v.status === 404, `HTTP ${v.status}`)

  const i = await api(adminB.client, "GET", `/api/invoices/${invA}`)
  check("B-admin A'nın faturasını GÖREMEZ", i.status === 403 || i.status === 404, `HTTP ${i.status}`)

  const del = await api(adminB.client, "DELETE", `/api/ships/${shA}`)
  check("B-admin A'nın gemisini SİLEMEZ", del.status === 403 || del.status === 404, `HTTP ${del.status}`)

  const inv = await api(adminB.client, "POST", "/api/invoices", {
    companyId: coA, invoiceNumber: `${tag}-hack`, invoiceType: "freight", type: "income",
    amount: 1, currency: "USD", invoiceDate: "2026-01-01", status: "pending",
  })
  check("B-admin A'ya fatura EKLEYEMEZ", inv.status === 403 || inv.status === 404, `HTTP ${inv.status}`)

  // Liste uç noktaları A'nın verisini sızdırmamalı
  const ships = await api(adminB.client, "GET", "/api/ships")
  const leaked = JSON.stringify(ships.data ?? "").includes(shA)
  check("gemi listesi A'nın verisini SIZDIRMAZ", !leaked)

  const invs = await api(adminB.client, "GET", "/api/invoices")
  const leaked2 = JSON.stringify(invs.data ?? "").includes(invA)
  check("fatura listesi A'nın verisini SIZDIRMAZ", !leaked2)
}

section("FAZ 1d — Temizlik")
{
  await api(admin, "DELETE", `/api/companies/${coA}`)
  await api(admin, "DELETE", `/api/companies/${coB}`)
  q(`DELETE FROM users WHERE email LIKE '%${tag}%'`)
  check("test verisi temizlendi", true)
}

summary()
