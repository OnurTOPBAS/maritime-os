"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const categories = [
  { value: "maintenance", label: "Bakım" },
  { value: "inspection", label: "Denetim" },
  { value: "documentation", label: "Dokümantasyon" },
  { value: "compliance", label: "Uyumluluk" },
  { value: "crew_management", label: "Mürettebat Yönetimi" },
  { value: "certificate_renewal", label: "Sertifika Yenileme" },
  { value: "port_operations", label: "Liman İşlemleri" },
  { value: "cargo_operations", label: "Kargo İşlemleri" },
  { value: "safety", label: "Güvenlik" },
  { value: "other", label: "Diğer" },
]

const priorities = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
  { value: "urgent", label: "Acil" },
]

interface TaskFormProps {
  onSuccess: () => void
  task?: any // renamed from initialData to task for clarity
}

export function TaskForm({ onSuccess, task }: TaskFormProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [ships, setShips] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string>("")
  const [additionalAssignees, setAdditionalAssignees] = useState<string[]>([])

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    category: task?.category || "",
    priority: task?.priority || "medium",
    assignedTo: task?.assigned_to || "",
    shipId: task?.ship_id || "",
    startDate: formatDateForInput(task?.start_date),
    dueDate: formatDateForInput(task?.due_date),
  })

  useEffect(() => {
    loadCompanyAndData()
  }, [])

  const loadCompanyAndData = async () => {
    try {
      const companyResponse = await fetch("/api/companies")
      const companyData = await companyResponse.json()
      const userCompany = Array.isArray(companyData) ? companyData[0] : companyData.companies?.[0]

      if (userCompany?.id) {
        setCompanyId(userCompany.id)
        await Promise.all([loadUsers(userCompany.id), loadShips()])
      }
    } catch (error) {
      console.error("[v0] Error loading company:", error)
    }
  }

  const loadUsers = async (companyId: string) => {
    try {
      const response = await fetch(`/api/users?companyId=${companyId}`)
      const data = await response.json()
      console.log("[v0] Users loaded:", data)
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      setUsers([])
    }
  }

  const loadShips = async () => {
    try {
      const response = await fetch("/api/ships")
      const data = await response.json()
      console.log("[v0] Ships loaded:", data)
      setShips(Array.isArray(data) ? data : data.ships || [])
    } catch (error) {
      console.error("[v0] Error loading ships:", error)
      setShips([])
    }
  }

  const toggleAdditionalAssignee = (userId: string) => {
    setAdditionalAssignees((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
        method: task ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          assignedTo: formData.assignedTo,
          shipId: formData.shipId,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          additionalAssignees,
        }),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error("[v0] Error saving task:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Görev Başlığı *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Öncelik</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((pri) => (
                <SelectItem key={pri.value} value={pri.value}>
                  {pri.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Ana Sorumlu Kişi *</Label>
          <Select
            value={formData.assignedTo}
            onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={users.length === 0 ? "Takım üyeleri yükleniyor..." : "Kullanıcı seçin"} />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} {user.is_owner && "(Sahip)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shipId">Gemi</Label>
          <Select value={formData.shipId} onValueChange={(value) => setFormData({ ...formData, shipId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Gemi seçin" />
            </SelectTrigger>
            <SelectContent>
              {ships.map((ship) => (
                <SelectItem key={ship.id} value={ship.id}>
                  {ship.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {users.length > 0 && (
        <div className="space-y-2">
          <Label>Ek Sorumlu Kişiler (Opsiyonel)</Label>
          <div className="rounded-md border p-4">
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {users
                  .filter((user) => user.id !== formData.assignedTo)
                  .map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={additionalAssignees.includes(user.id)}
                        onCheckedChange={() => toggleAdditionalAssignee(user.id)}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {user.name} {user.is_owner && "(Sahip)"}
                      </label>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground mt-2">{additionalAssignees.length} kişi seçildi</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Başlangıç Tarihi</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Bitiş Tarihi</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Kaydediliyor..." : task ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  )
}
