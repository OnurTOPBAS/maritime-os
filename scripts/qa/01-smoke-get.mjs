import { newClient, login, api, check, section, summary } from "./harness.mjs"
import { staticGetRoutes } from "./routes.mjs"

const ROUTES = staticGetRoutes()
const admin = newClient("admin")
if (!(await login(admin, "onur@test.local", "Gemi2024Liman"))) {
  console.error("Giriş başarısız — sunucu çalışıyor mu?"); process.exit(1)
}
section(`FAZ 1a — ${ROUTES.length} statik GET rotası (admin oturumu)`)
for (const route of ROUTES) {
  const r = await api(admin, "GET", route)
  const good = r.status === 200 || r.status === 304 || r.status === 400
  const detail = r.status === 500
    ? `500 SUNUCU HATASI: ${JSON.stringify(r.data).slice(0,90)}`
    : r.status === 307 ? "307 YÖNLENDİRME (auth bozuk)"
    : `HTTP ${r.status}`
  check(route, good, good ? `HTTP ${r.status}` : detail)
}
summary()
