"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Shield, Save } from "lucide-react"

interface ModulePermission {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
  dataScope: string
}

interface PermissionManagerProps {
  userId: number
  userName: string
}

const MODULES = [
  { id: "ships", name: "Gemiler" },
  { id: "fixtures", name: "Fixture'lar" },
  { id: "voyages", name: "Seferler" },
  { id: "invoices", name: "Faturalar" },
  { id: "reports", name: "Raporlar" },
  { id: "users", name: "Kullanıcılar" },
]

export function PermissionManager({ userId, userName }: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPermissions()
  }, [userId])

  const loadPermissions = async () => {
    try {
      const response = await fetch(`/api/permissions/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error("Error loading permissions:", error)
      toast.error("İzinler yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const updatePermission = (module: string, field: keyof ModulePermission, value: any) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...(prev[module] || {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
          dataScope: "all",
        }),
        [field]: value,
      },
    }))
  }

  const savePermissions = async (module: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/permissions/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          permissions: permissions[module],
        }),
      })

      if (response.ok) {
        toast.success(`${MODULES.find((m) => m.id === module)?.name} izinleri güncellendi`)
      } else {
        toast.error("İzinler güncellenirken hata oluştu")
      }
    } catch (error) {
      console.error("Error saving permissions:", error)
      toast.error("İzinler güncellenirken hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <div>
          <h3 className="text-lg font-medium">{userName} - Özel İzinler</h3>
          <p className="text-sm text-muted-foreground">Modül bazlı erişim kontrolü ve veri seviyesi izinler</p>
        </div>
      </div>

      <div className="grid gap-4">
        {MODULES.map((module) => {
          const perm = permissions[module.id] || {
            canView: true,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canExport: false,
            dataScope: "all",
          }

          return (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="text-base">{module.name}</CardTitle>
                <CardDescription>Bu modül için izinleri yapılandırın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${module.id}-view`}>Görüntüleme</Label>
                    <Switch
                      id={`${module.id}-view`}
                      checked={perm.canView}
                      onCheckedChange={(checked) => updatePermission(module.id, "canView", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${module.id}-create`}>Oluşturma</Label>
                    <Switch
                      id={`${module.id}-create`}
                      checked={perm.canCreate}
                      onCheckedChange={(checked) => updatePermission(module.id, "canCreate", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${module.id}-edit`}>Düzenleme</Label>
                    <Switch
                      id={`${module.id}-edit`}
                      checked={perm.canEdit}
                      onCheckedChange={(checked) => updatePermission(module.id, "canEdit", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${module.id}-delete`}>Silme</Label>
                    <Switch
                      id={`${module.id}-delete`}
                      checked={perm.canDelete}
                      onCheckedChange={(checked) => updatePermission(module.id, "canDelete", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${module.id}-export`}>Dışa Aktarma</Label>
                    <Switch
                      id={`${module.id}-export`}
                      checked={perm.canExport}
                      onCheckedChange={(checked) => updatePermission(module.id, "canExport", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${module.id}-scope`}>Veri Erişim Kapsamı</Label>
                  <Select
                    value={perm.dataScope}
                    onValueChange={(value) => updatePermission(module.id, "dataScope", value)}
                  >
                    <SelectTrigger id={`${module.id}-scope`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Veriler</SelectItem>
                      <SelectItem value="department">Sadece Departman</SelectItem>
                      <SelectItem value="own">Sadece Kendi Kayıtları</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => savePermissions(module.id)} disabled={saving} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
