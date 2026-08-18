"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Edit, Trash2, Search } from "lucide-react"
import { RoleManagement } from "@/components/role-management"

interface User {
  id: string
  name: string
  email: string
  permission_role: string
  is_active: boolean
  is_owner: boolean
  created_at: string
  departmentId: string
}

interface Role {
  /** Koda bağlanan sabit tanımlayıcı; role_permissions eşlemesi bunu kullanır. */
  slug: string
  name: string
  description: string | null
}

interface UserManagementProps {
  companyId: string
}

export function UserManagement({ companyId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  })
  const [roles, setRoles] = useState<Role[]>([])
  // "new" = yeni kullanıcı oluştur, "existing" = kayıtlı kullanıcıyı e-posta ile ata
  const [addMode, setAddMode] = useState<"new" | "existing">("new")
  // Giriş yapan kişi: kendi id'si + süper yönetici mi? Başkasının şifresini
  // yalnızca süper yönetici değiştirebilir (sunucu da bunu zorlar).
  const [viewer, setViewer] = useState<{ id: string; superAdmin: boolean } | null>(null)

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [companyId])

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/auth/my-modules").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([me, mods]) => {
        setViewer({ id: me?.user?.id ?? "", superAdmin: !!mods?.superAdmin })
      })
      .catch(() => {})
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    const response = await fetch("/api/roles/assignable")
    if (response.ok) {
      const data = await response.json()
      setRoles(data)
    }
  }

  const handleAddUser = async () => {
    // Mevcut kullanıcı atama: yalnızca e-posta + rol.
    if (addMode === "existing") {
      if (!formData.email) {
        alert("Lütfen e-posta girin")
        return
      }
      try {
        const response = await fetch("/api/users/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, role: formData.role, companyId }),
        })
        if (response.ok) {
          setIsAddDialogOpen(false)
          setFormData({ name: "", email: "", password: "", role: "viewer" })
          loadUsers()
        } else {
          const error = await response.json()
          alert(error.error || "Kullanıcı atanamadı")
        }
      } catch (error) {
        console.error("Error assigning user:", error)
        alert("Kullanıcı atanamadı")
      }
      return
    }

    // Yeni kullanıcı oluştur.
    if (!formData.name || !formData.email || !formData.password) {
      alert("Lütfen tüm zorunlu alanları doldurun")
      return
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId,
        }),
      })

      if (response.ok) {
        setIsAddDialogOpen(false)
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "viewer",
        })
        loadUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add user")
      }
    } catch (error) {
      console.error("Error adding user:", error)
      alert("Failed to add user")
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId,
        }),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "viewer",
        })
        loadUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user")
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/users/${userId}?companyId=${companyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user")
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.permission_role,
    })
    setIsEditDialogOpen(true)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="roles">Rol Yönetimi</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Kullanıcı Ekle
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.permission_role === "admin" ? "default" : "secondary"}>
                          {user.permission_role}
                        </Badge>
                        {user.is_owner && (
                          <Badge variant="outline" className="ml-2">
                            Owner
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!user.is_owner && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeactivateUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Kullanıcı Ekle</DialogTitle>
                <DialogDescription>Bu şirkete kullanıcı ekleyin veya kayıtlı birini atayın.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Mod: yeni oluştur mu, kayıtlı kullanıcıyı mı ata */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={addMode === "new" ? "default" : "outline"}
                    onClick={() => setAddMode("new")}
                  >
                    Yeni Kullanıcı
                  </Button>
                  <Button
                    type="button"
                    variant={addMode === "existing" ? "default" : "outline"}
                    onClick={() => setAddMode("existing")}
                  >
                    Kayıtlı Kullanıcı
                  </Button>
                </div>

                {addMode === "new" && (
                  <div>
                    <Label htmlFor="name">İsim *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ahmet@example.com"
                  />
                  {addMode === "existing" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Bu e-postayla <strong>kayıt olmuş</strong> bir kullanıcı seçili şirkete eklenir.
                    </p>
                  )}
                </div>
                {addMode === "new" && (
                  <div>
                    <Label htmlFor="password">Şifre *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Güçlü bir şifre"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.length === 0 ? (
                        <SelectItem value="viewer">Viewer (Varsayılan)</SelectItem>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role.slug} value={role.slug}>
                            {role.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleAddUser}>Ekle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Kullanıcı Düzenle</DialogTitle>
                <DialogDescription>Kullanıcı bilgilerini güncelleyin.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">İsim</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                {(viewer?.superAdmin || (selectedUser && viewer?.id === selectedUser.id)) && (
                  <div>
                    <Label htmlFor="edit-password">Yeni Şifre (opsiyonel)</Label>
                    <Input
                      id="edit-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Değiştirmek için yeni şifre girin"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.slug} value={role.slug}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleEditUser}>Güncelle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
