"use client"

/**
 * İstemci (client) sayfaları için modül erişim kapısı.
 *
 * Sunucu bileşenleri lib/page-guard.ts kullanır; ancak "use client" sayfalar
 * sunucuda kontrol edemez. Bu bileşen /api/auth/my-modules'tan izinleri çeker,
 * yetki yoksa kullanıcıyı yönlendirir ve içeriği hiç göstermez.
 *
 *   return (
 *     <ModuleGuard module="tasks">
 *       ...sayfa içeriği...
 *     </ModuleGuard>
 *   )
 *
 * Not: Asıl güvenlik sınırı yine sunucudaki API'lerdir; bu yalnızca arayüzün
 * yetkisiz kullanıcıya hiç açılmamasını sağlar (derinlemesine savunma).
 */

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface Props {
  module: string
  action?: string
  fallback?: string
  children: ReactNode
}

export function ModuleGuard({ module, action = "view", fallback = "/dashboard", children }: Props) {
  const router = useRouter()
  const [state, setState] = useState<"loading" | "ok" | "deny">("loading")

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/my-modules")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        if (!d) {
          setState("deny")
          router.replace(fallback)
          return
        }
        const perms = new Set<string>(d.actions || [])
        const ok =
          d.superAdmin ||
          perms.has("*") ||
          perms.has(`*.${action}`) ||
          perms.has(`${module}.${action}`)
        setState(ok ? "ok" : "deny")
        if (!ok) router.replace(fallback)
      })
      .catch(() => {
        if (!cancelled) setState("deny")
      })
    return () => {
      cancelled = true
    }
  }, [module, action, fallback, router])

  if (state !== "ok") return null
  return <>{children}</>
}
