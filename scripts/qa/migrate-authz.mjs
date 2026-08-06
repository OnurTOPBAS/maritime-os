/**
 * Rotalardaki satır-içi erişim kontrollerini merkezi yetki katmanına taşır.
 *
 * ESKİ KALIP (rol ayrımı yapmaz, user_permissions üyelerini tanımaz):
 *   const rows = await sql`
 *     SELECT x.id FROM ...
 *     LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
 *     WHERE x.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
 *   `
 *   if (rows.length === 0) return 404
 *
 * YENİ:
 *   await requireResourceAccess(user.id, resolver, id, "modül", "eylem", "mesaj")
 *
 * Betik yalnızca tam eşleşen kalıbı değiştirir; eşleşmeyen dosyaları atlar ve
 * raporlar. Elle gözden geçirme için değişiklikleri listeler.
 */
import fs from "node:fs"

/** dosya -> { resolver, module, importFrom } */
const PLAN = {
  "app/api/bank-accounts/[id]/route.ts": { resolver: "resolveBankAccountCompany", module: "finance", notFound: "Hesap bulunamadı" },
  "app/api/fleet-banks/[id]/route.ts": { resolver: "resolveFleetBankCompany", module: "finance", notFound: "Banka bulunamadı" },
  "app/api/invoices/[id]/route.ts": { resolver: "resolveInvoiceCompany", module: "invoices", notFound: "Fatura bulunamadı" },
  "app/api/fixtures/[id]/route.ts": { resolver: "resolveFixtureCompany", module: "fixtures", notFound: "Fixture bulunamadı" },
  "app/api/voyages/[id]/route.ts": { resolver: "resolveVoyageCompany", module: "voyages", notFound: "Sefer bulunamadı" },
  "app/api/tasks/[taskId]/route.ts": { resolver: "resolveTaskCompany", module: "tasks", notFound: "Görev bulunamadı" },
}

const ACTION_BY_METHOD = { GET: "view", POST: "create", PUT: "edit", PATCH: "edit", DELETE: "delete" }

/** Satır-içi erişim sorgusu + 404 kontrolü bloğunu bulan kalıp. */
const BLOCK = new RegExp(
  String.raw`(?:\n[ \t]*//[^\n]*\n)?` +          // isteğe bağlı yorum satırı
    String.raw`[ \t]*const (\w+) = await sql\`` + // const X = await sql`
    String.raw`[\s\S]*?company_team_members[\s\S]*?` +
    String.raw`ctm\.user_id IS NOT NULL\)\s*\`` +
    String.raw`\s*\n\s*if \(\1\.length === 0\) \{[\s\S]*?\n[ \t]*\}`,
  "g",
)

let changed = 0
const skipped = []

for (const [file, cfg] of Object.entries(PLAN)) {
  if (!fs.existsSync(file)) { skipped.push(`${file} (yok)`); continue }
  let src = fs.readFileSync(file, "utf8")
  const original = src

  // Hangi handler içindeyiz? Blokları sırayla işleyip metoda göre eylem seç.
  let count = 0
  src = src.replace(BLOCK, (match, _varName, offset) => {
    // Bu bloktan önceki en yakın "export async function X" ı bul
    const before = src.slice(0, offset)
    const m = [...before.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].pop()
    const method = m ? m[1] : "GET"
    const action = ACTION_BY_METHOD[method] ?? "view"
    count++
    return (
      `\n    // Erişim merkezi yetki katmanından doğrulanır: hem user_permissions\n` +
      `    // hem company_team_members üyelikleri ve rol izinleri dikkate alınır.\n` +
      `    await requireResourceAccess(user.id, ${cfg.resolver}, id, "${cfg.module}", "${action}", "${cfg.notFound}")`
    )
  })

  if (count === 0) { skipped.push(`${file} (kalıp eşleşmedi)`); continue }

  // importları ekle
  if (!src.includes("requireResourceAccess")) {
    src = src.replace(
      /(import \{[^}]*\} from "@\/lib\/session")/,
      `$1\nimport { requireResourceAccess, ${cfg.resolver} } from "@/lib/authz"\nimport { handleApiError } from "@/lib/api-error"`,
    )
  }

  if (src !== original) {
    fs.writeFileSync(file, src)
    console.log(`✅ ${file}  (${count} blok)`)
    changed++
  }
}

console.log(`\nDeğiştirilen: ${changed}`)
if (skipped.length) {
  console.log("Atlananlar (elle bakılacak):")
  skipped.forEach((s) => console.log("  -", s))
}
