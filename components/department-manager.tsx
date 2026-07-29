"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Building2, Plus, Edit, Trash2, Users, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Department {
  id: number
  name: string
  description: string
  manager_id: number
  manager_name: string
  member_count: number
}

interface User {
  id: number
  name: string
}

export function DepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "0", // Updated default value to be a non-empty string
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [deptsRes, usersRes] = await Promise.all([fetch("/api/departments"), fetch("/api/users")])

      if (!deptsRes.ok) {
        const errorData = await deptsRes.json()
        if (errorData.error === "TABLE_NOT_EXISTS") {
          setError(
            "Departman özelliği henüz aktif değil. Veritabanı migration scriptini (014_add_departments_and_groups.sql) çalıştırmanız gerekiyor.",
          )
          setLoading(false)
          return
        }
        throw new Error(errorData.error || "Departmanlar yüklenemedi")
      }

      if (deptsRes.ok && usersRes.ok) {
        const deptsData = await deptsRes.json()
        const usersData = await usersRes.json()
        setDepartments(deptsData)
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Veriler yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingDept ? `/api/departments/${editingDept.id}` : "/api/departments"
      const method = editingDept ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          managerId: formData.managerId ? Number.parseInt(formData.managerId) : null,
        }),
      })

      if (response.ok) {
        toast.success(editingDept ? "Departman güncellendi" : "Departman oluşturuldu")
        setDialogOpen(false)
        resetForm()
        loadData()
      } else {
        const data = await response.json()
        toast.error(data.error || "İşlem başarısız")
      }
    } catch (error) {
      console.error("Error saving department:", error)
      toast.error("Departman kaydedilirken hata oluştu")
    }
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      description: dept.description || "",
      managerId: dept.manager_id?.toString() || "0", // Updated default value to be a non-empty string
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu departmanı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/departments/${id}`, { method: "DELETE" })

      if (response.ok) {
        toast.success("Departman silindi")
        loadData()
      } else {
        toast.error("Departman silinemedi")
      }
    } catch (error) {
      console.error("Error deleting department:", error)
      toast.error("Departman silinirken hata oluştu")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", managerId: "0" }) // Updated default value to be a non-empty string
    setEditingDept(null)
  }

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Veritabanı Migration Gerekli</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <div className="mt-4">
            <p className="text-sm font-medium">Migration scriptini çalıştırmak için:</p>
            <ol className="mt-2 list-decimal list-inside text-sm space-y-1">
              <li>
                Sol menüden veya üst menüden <strong>Scripts</strong> bölümüne gidin
              </li>
              <li>
                <strong>014_add_departments_and_groups.sql</strong> dosyasını bulun
              </li>
              <li>
                <strong>Run Script</strong> butonuna tıklayın
              </li>
              <li>Script başarıyla çalıştıktan sonra bu sayfayı yenileyin</li>
            </ol>
            <div className="mt-4">
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Sayfayı Yenile
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <div>
            <h3 className="text-lg font-medium">Departmanlar</h3>
            <p className="text-sm text-muted-foreground">Şirket departmanlarını yönetin</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Departman
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? "Departman Düzenle" : "Yeni Departman"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Departman Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="manager">Departman Yöneticisi</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                >
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Yönetici seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Yönetici Yok</SelectItem> {/* Updated value to be a non-empty string */}
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingDept ? "Güncelle" : "Oluştur"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{dept.name}</CardTitle>
                  <CardDescription className="mt-1">{dept.description || "Açıklama yok"}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(dept.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {dept.manager_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Yönetici: {dept.manager_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{dept.member_count} üye</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {departments.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">Henüz departman oluşturulmamış</CardContent>
        </Card>
      )}
    </div>
  )
}
