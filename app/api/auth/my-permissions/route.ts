import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import {
  isSuperAdmin,
  getAccessibleCompanyIds,
  getUserRole,
  getRolePermissions,
} from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/** Modül ve eylem adlarının okunur Türkçe karşılıkları (arayüz için). */
const MODULE_LABELS: Record<string, string> = {
  ships: "Gemiler",
  fleets: "Filolar",
  fixtures: "Fixtureler",
  voyages: "Seferler",
  voyage_account: "Sefer Hesabı",
  certificates: "Sertifikalar",
  documents: "Belgeler",
  invoices: "Faturalar",
  finance: "Finans",
  office_pnl: "Office PnL",
  tasks: "Görevler",
  reports: "Raporlar",
  users: "Kullanıcılar",
  settings: "Ayarlar",
  ports: "Limanlar",
  banks: "Bankalar",
}

const ACTION_LABELS: Record<string, string> = {
  view: "Görüntüleme",
  create: "Ekleme",
  edit: "Düzenleme",
  delete: "Silme",
  export: "Dışa Aktarma",
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Yönetici (Admin)",
  manager: "Müdür (Manager)",
  operations_manager: "Operasyon Müdürü",
  finance_manager: "Finans Müdürü",
  technical_manager: "Teknik Müdür",
  viewer: "Görüntüleyici",
}

/**
 * Giriş yapmış kullanıcının kendi yetkilerini döndürür: süper yönetici mi,
 * hangi şirkette hangi rolde ve o rolün hangi modüllerde neler yapabildiği.
 */
export async function GET() {
  try {
    const user = await requireAuth()

    const superAdmin = await isSuperAdmin(user.id)
    const companyIds = await getAccessibleCompanyIds(user.id)

    const companies = []
    for (const companyId of companyIds) {
      const [company] = await sql`SELECT name FROM companies WHERE id = ${companyId}`
      if (!company) continue

      const role = await getUserRole(user.id, companyId)
      const roleSlug = role ?? "viewer"
      const perms = await getRolePermissions(roleSlug)

      // "*.eylem" (joker) varsa tüm modüllerde o eylem yapılabilir.
      const wildcard = perms.some((p) => p.startsWith("*."))
      const byModule: Record<string, string[]> = {}
      for (const p of perms) {
        const [mod, action] = p.split(".")
        if (mod === "*") continue
        ;(byModule[mod] ??= []).push(action)
      }

      companies.push({
        companyId,
        companyName: company.name,
        role: roleSlug,
        roleLabel: ROLE_LABELS[roleSlug] ?? roleSlug,
        full: superAdmin || wildcard,
        modules: Object.entries(byModule)
          .map(([mod, actions]) => ({
            module: mod,
            moduleLabel: MODULE_LABELS[mod] ?? mod,
            actions: actions.map((a) => ({ action: a, actionLabel: ACTION_LABELS[a] ?? a })),
          }))
          .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel, "tr")),
      })
    }

    return NextResponse.json({ isSuperAdmin: superAdmin, companies })
  } catch (error) {
    return handleApiError(error, "Yetkiler")
  }
}
