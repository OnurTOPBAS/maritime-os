/** Tüm QA paketlerini sırayla çalıştırır. Uygulama ayakta olmalıdır. */
import { execSync } from "node:child_process"

const SUITES = [
  ["01-smoke-get", "Duman testi — tüm GET rotaları"],
  ["02-crud-lifecycle", "CRUD yaşam döngüsü"],
  ["03-rbac-enforcement", "RBAC yetki zorlaması"],
  ["04-rbac-deep", "Derin RBAC + şirket izolasyonu"],
  ["05-security", "Güvenlik / sızma testleri"],
  ["06-file-storage", "Yerel dosya depolama"],
]

let totalPass = 0, totalFail = 0
for (const [file, label] of SUITES) {
  const out = execSync(`node scripts/qa/${file}.mjs`, { encoding: "utf8" })
  const m = out.match(/SONUÇ: (\d+) geçti, (\d+) kaldı/)
  const pass = m ? +m[1] : 0, fail = m ? +m[2] : 0
  totalPass += pass; totalFail += fail
  console.log(`${fail === 0 ? "✅" : "❌"} ${label.padEnd(38)} ${pass} geçti, ${fail} kaldı`)
  if (fail > 0) console.log(out.split("BAŞARISIZLAR:")[1] ?? "")
}
console.log("─".repeat(60))
console.log(`TOPLAM: ${totalPass} geçti, ${totalFail} kaldı`)
process.exit(totalFail === 0 ? 0 : 1)
