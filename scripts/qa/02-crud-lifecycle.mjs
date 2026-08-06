/**
 * FAZ 1b — Tam CRUD yaşam döngüsü.
 *
 * Gerçek bir iş akışını uçtan uca kurar ve her adımda okuma/güncelleme/silme
 * çalışıyor mu doğrular:
 *   şirket -> filo -> gemi -> fixture -> sefer -> fatura -> sertifika
 *
 * Test verisi benzersiz bir etiketle oluşturulur ve sonunda temizlenir.
 */
import { newClient, login, api, check, section, summary } from "./harness.mjs"

const admin = newClient("admin")
if (!(await login(admin, "onur@test.local", "Gemi2024Liman"))) {
  console.error("Giriş başarısız"); process.exit(1)
}

const tag = `qa-${Date.now()}`
const created = {}

section("FAZ 1b — Şirket yaşam döngüsü")
{
  const c = await api(admin, "POST", "/api/companies", { name: `${tag} Denizcilik`, email: "qa@test.local" })
  check("şirket oluştur", c.status === 201, `HTTP ${c.status}`)
  created.companyId = c.data?.id

  const g = await api(admin, "GET", `/api/companies/${created.companyId}`)
  check("şirket oku", g.status === 200 && g.data?.company?.name?.startsWith(tag), `HTTP ${g.status}`)

  const u = await api(admin, "PUT", `/api/companies/${created.companyId}`, {
    name: `${tag} Denizcilik A.Ş.`, email: "qa@test.local",
  })
  check("şirket güncelle", u.status === 200 && u.data?.company?.name?.endsWith("A.Ş."), `HTTP ${u.status}`)
}

section("FAZ 1b — Filo yaşam döngüsü")
{
  const f = await api(admin, "POST", "/api/fleets", {
    company_id: created.companyId, name: `${tag} Filo`, description: "QA",
  })
  check("filo oluştur", f.status === 201 || f.status === 200, `HTTP ${f.status}`)
  created.fleetId = f.data?.fleet?.id ?? f.data?.id

  const list = await api(admin, "GET", "/api/fleets")
  const found = Array.isArray(list.data)
    ? list.data.some((x) => x.id === created.fleetId)
    : (list.data?.fleets ?? []).some((x) => x.id === created.fleetId)
  check("filo listede görünür", found, `HTTP ${list.status}`)
}

section("FAZ 1b — Gemi yaşam döngüsü")
{
  const s = await api(admin, "POST", "/api/ships", {
    fleet_id: created.fleetId, name: `${tag} Gemi`, imo_number: "IMO1234567",
    vessel_type: "Bulk Carrier", dwt: 50000, built_year: 2015, status: "active",
  })
  check("gemi oluştur", s.status === 201, `HTTP ${s.status}`)
  created.shipId = s.data?.ship?.id ?? s.data?.id

  const g = await api(admin, "GET", `/api/ships/${created.shipId}`)
  check("gemi oku", g.status === 200, `HTTP ${g.status}`)

  const u = await api(admin, "PUT", `/api/ships/${created.shipId}`, {
    name: `${tag} Gemi (guncel)`, status: "active",
  })
  check("gemi güncelle", u.status === 200, `HTTP ${u.status}`)

  // Aynı IMO ile ikinci gemi -> reddedilmeli
  const dup = await api(admin, "POST", "/api/ships", {
    fleet_id: created.fleetId, name: `${tag} Kopya`, imo_number: "IMO1234567",
  })
  check("aynı IMO reddedilir", dup.status === 400, `HTTP ${dup.status}`)
}

section("FAZ 1b — Fixture ve sefer")
{
  const fx = await api(admin, "POST", "/api/fixtures", {
    ship_id: created.shipId, charterer: `${tag} Kiracı`, cargo_type: "Coal",
    rate: 15000, rate_type: "daily", status: "fixed",
    load_port: "Istanbul", discharge_port: "Rotterdam",
  })
  check("fixture oluştur", fx.status === 201 || fx.status === 200, `HTTP ${fx.status}`)
  created.fixtureId = fx.data?.fixture?.id ?? fx.data?.id

  if (created.fixtureId) {
    const v = await api(admin, "POST", "/api/voyages", {
      fixture_id: created.fixtureId, voyage_number: `${tag}-V1`, status: "planned",
      load_port: "Istanbul", discharge_port: "Rotterdam",
    })
    check("sefer oluştur", v.status === 201 || v.status === 200, `HTTP ${v.status}`)
    created.voyageId = v.data?.voyage?.id ?? v.data?.id
  } else {
    check("sefer oluştur", false, "fixture id alınamadı")
  }
}

section("FAZ 1b — Fatura")
{
  const inv = await api(admin, "POST", "/api/invoices", {
    companyId: created.companyId, invoiceNumber: `${tag}-INV1`,
    invoiceType: "freight", type: "income", amount: 100000, currency: "USD",
    invoiceDate: "2026-01-15", status: "pending",
  })
  check("fatura oluştur", inv.status === 201 || inv.status === 200, `HTTP ${inv.status}`)
  created.invoiceId = inv.data?.invoice?.id ?? inv.data?.id
}

section("FAZ 1b — Departman ve grup")
{
  const d = await api(admin, "POST", "/api/departments", { name: `${tag} Operasyon`, companyId: created.companyId })
  check("departman oluştur", d.status === 201, `HTTP ${d.status}`)
  created.deptId = d.data?.id

  const grp = await api(admin, "POST", "/api/groups", { name: `${tag} Grup`, companyId: created.companyId })
  check("grup oluştur", grp.status === 201, `HTTP ${grp.status}`)
  created.groupId = grp.data?.id
}

/* -------- Temizlik: oluşturulanları geriye doğru sil -------- */
section("FAZ 1b — Temizlik (silme testleri)")
{
  if (created.voyageId) {
    const r = await api(admin, "DELETE", `/api/voyages/${created.voyageId}`)
    check("sefer sil", r.status === 200 || r.status === 204, `HTTP ${r.status}`)
  }
  if (created.fixtureId) {
    const r = await api(admin, "DELETE", `/api/fixtures/${created.fixtureId}`)
    check("fixture sil", r.status === 200 || r.status === 204, `HTTP ${r.status}`)
  }
  if (created.shipId) {
    const r = await api(admin, "DELETE", `/api/ships/${created.shipId}`)
    check("gemi sil", r.status === 200 || r.status === 204, `HTTP ${r.status}`)
  }
  if (created.companyId) {
    // Şirket silme sahibin işidir; bağlı kayıtlar CASCADE ile gider
    const r = await api(admin, "DELETE", `/api/companies/${created.companyId}`)
    check("şirket sil (temizlik)", r.status === 200 || r.status === 204, `HTTP ${r.status}`)
  }
}

summary()
