"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Shield, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Role {
  id: string
  name: string
  description: string
  is_system: boolean
  permission_count?: number
}

interface Permission {
  id: string
  module: string
  action: string
  description: string
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  const loadRoles = async () => {
    try {
      console.log("[v0] Loading roles...")
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/roles")
      console.log("[v0] Roles response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Roles loaded:", data)
        setRoles(data)
      } else {
        const errorData = await response.json()
        console.error("[v0] Failed to load roles:", errorData)
        setError("Roller yüklenemedi. Veritabanı tabloları oluşturulmamış olabilir.")
      }
    } catch (err) {
      console.error("[v0] Error loading roles:", err)
      setError("Roller yüklenirken bir hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      console.log("[v0] Loading permissions...")
      const response = await fetch("/api/permissions")
      console.log("[v0] Permissions response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Permissions loaded:", data)
        setPermissions(data)
      }
    } catch (err) {
      console.error("[v0] Error loading permissions:", err)
    }
  }

  const loadRolePermissions = async (roleId: string) => {
    const response = await fetch(`/api/roles/${roleId}/permissions`)
    if (response.ok) {
      const data = await response.json()
      setRolePermissions(data.map((p: Permission) => p.id))
    }
  }

  const handleAddRole = async () => {
    const response = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    if (response.ok) {
      setIsAddDialogOpen(false)
      setFormData({ name: "", description: "" })
      loadRoles()
    }
  }

  const handleEditRole = async () => {
    if (!selectedRole) return
    const response = await fetch(`/api/roles/${selectedRole.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    if (response.ok) {
      setIsEditDialogOpen(false)
      setSelectedRole(null)
      setFormData({ name: "", description: "" })
      loadRoles()
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Bu rolü silmek istediğinizden emin misiniz?")) return
    const response = await fetch(`/api/roles/${roleId}`, { method: "DELETE" })
    if (response.ok) loadRoles()
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionIds: rolePermissions }),
    })
    if (response.ok) {
      setIsPermissionsDialogOpen(false)
      loadRoles()
    }
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setFormData({ name: role.name, description: role.description })
    setIsEditDialogOpen(true)
  }

  const openPermissionsDialog = async (role: Role) => {
    setSelectedRole(role)
    await loadRolePermissions(role.id)
    setIsPermissionsDialogOpen(true)
  }

  const togglePermission = (permissionId: string) => {
    setRolePermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    )
  }

  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = []
      acc[perm.module].push(perm)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Roller yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Veritabanı tablolarını oluşturmak için lütfen{" "}
          <code className="bg-muted px-2 py-1 rounded">scripts/035_advanced_user_management.sql</code> scriptini
          çalıştırın.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rol Yönetimi</h2>
          <p className="text-muted-foreground">Özel roller oluşturun ve yetkileri yönetin</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Rol
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                {role.is_system && <Badge variant="secondary">Sistem</Badge>}
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{role.permission_count || 0} yetki</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openPermissionsDialog(role)}>
                    Yetkiler
                  </Button>
                  {!role.is_system && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Rol Oluştur</DialogTitle>
            <DialogDescription>Özel bir rol tanımlayın ve yetkilerini belirleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rol Adı</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddRole}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rol Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rol Adı</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEditRole}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name} - Yetki Yönetimi</DialogTitle>
            <DialogDescription>Bu rol için yetkileri seçin</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} className="space-y-3">
                <h4 className="font-semibold capitalize">{module}</h4>
                <div className="space-y-2 pl-4">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={rolePermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <label htmlFor={perm.id} className="text-sm cursor-pointer">
                        <span className="font-medium">{perm.action}</span> - {perm.description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSavePermissions}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
