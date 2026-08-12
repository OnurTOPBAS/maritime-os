"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Building2, Check } from "lucide-react"

interface PermAction {
  action: string
  actionLabel: string
}
interface PermModule {
  module: string
  moduleLabel: string
  actions: PermAction[]
}
interface CompanyPerms {
  companyId: string
  companyName: string
  role: string
  roleLabel: string
  full: boolean
  modules: PermModule[]
}
interface MyPermissions {
  isSuperAdmin: boolean
  companies: CompanyPerms[]
}

export function MyPermissions() {
  const [data, setData] = useState<MyPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/my-permissions")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Yetkiler yükleniyor...</p>
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Yetkiler alınamadı.</p>
  }

  return (
    <div className="space-y-4">
      {data.isSuperAdmin && (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-lg">Süper Yönetici</CardTitle>
              <CardDescription>
                Sistemdeki tüm şirketleri görebilir ve tüm işlemleri yapabilirsiniz.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {data.companies.length === 0 && !data.isSuperAdmin && (
        <p className="text-sm text-muted-foreground">Henüz bir şirkete atanmış yetkiniz yok.</p>
      )}

      {data.companies.map((c) => (
        <Card key={c.companyId}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {c.companyName}
              </CardTitle>
              <Badge variant="secondary">{c.roleLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {c.full ? (
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Bu şirkette <strong>tüm yetkilere</strong> sahipsiniz (tüm modüller).
              </div>
            ) : c.modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu şirkette tanımlı bir yetkiniz yok.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {c.modules.map((m) => (
                  <div key={m.module} className="rounded-md border p-3">
                    <div className="font-medium text-sm mb-2">{m.moduleLabel}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.actions.map((a) => (
                        <Badge key={a.action} variant="outline" className="font-normal">
                          {a.actionLabel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
