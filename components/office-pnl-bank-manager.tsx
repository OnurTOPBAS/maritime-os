"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Settings2, Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"

interface Bank {
  id: string
  name: string
}

interface Props {
  onChanged?: () => void
}

export function OfficePnlBankManager({ onChanged }: Props) {
  const [open, setOpen] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/office-pnl/payee-banks")
      if (res.ok) {
        const data = await res.json()
        setBanks(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    const res = await fetch("/api/office-pnl/payee-banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setNewName("")
      toast.success("Eklendi")
      load()
      onChanged?.()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || "Eklenemedi")
    }
  }

  const saveEdit = async (id: string) => {
    const name = editName.trim()
    if (!name) return
    const res = await fetch(`/api/office-pnl/payee-banks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setEditingId(null)
      toast.success("Güncellendi")
      load()
      onChanged?.()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || "Güncellenemedi")
    }
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`"${name}" silinsin mi?`)) return
    const res = await fetch(`/api/office-pnl/payee-banks/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Silindi")
      load()
      onChanged?.()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || "Silinemedi")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Banka & kasa yönetimi">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Banka & Kasa Yönetimi</DialogTitle>
        </DialogHeader>

        {/* Yeni ekle */}
        <div className="flex gap-2">
          <Input
            placeholder="Yeni banka / kasa adı"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} className="gap-1 shrink-0">
            <Plus className="h-4 w-4" /> Ekle
          </Button>
        </div>

        <div className="overflow-auto border rounded-md divide-y flex-1">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Yükleniyor...</div>
          ) : banks.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Kayıt yok.</div>
          ) : (
            banks.map((b) => (
              <div key={b.id} className="flex items-center gap-2 p-2">
                {editingId === b.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(b.id)}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(b.id)}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{b.name}</span>
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => { setEditingId(b.id); setEditName(b.name) }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => remove(b.id, b.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Kullanımda olan (kaydı/bakiyesi olan) bir hesap silinemez; önce ilgili
          kayıtları taşı veya sil.
        </p>
      </DialogContent>
    </Dialog>
  )
}
