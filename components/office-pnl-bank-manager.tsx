"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2, Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { BankIcon, bankTypeLabel, BANK_TYPES } from "@/components/bank-icon"

interface Bank {
  id: string
  name: string
  bank_type?: string
  company_id?: string
}

interface CompanyOpt { id: string; name: string }

interface Props {
  onChanged?: () => void
}

export function OfficePnlBankManager({ onChanged }: Props) {
  const [open, setOpen] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [companies, setCompanies] = useState<CompanyOpt[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("other")
  const [newCompanyId, setNewCompanyId] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const [banksRes, compRes] = await Promise.all([
        fetch("/api/office-pnl/payee-banks"),
        fetch("/api/companies"),
      ])
      if (banksRes.ok) {
        const data = await banksRes.json()
        setBanks(Array.isArray(data) ? data : [])
      }
      if (compRes.ok) {
        const d = await compRes.json()
        setCompanies(Array.isArray(d) ? d.map((c: any) => ({ id: c.id, name: c.name })) : [])
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
    if (!newCompanyId) {
      toast.error("Lütfen şirket seçin")
      return
    }
    const res = await fetch("/api/office-pnl/payee-banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bankType: newType, companyId: newCompanyId }),
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

        {/* Yeni ekle: ad + banka tipi + şirket */}
        <div className="space-y-2 border rounded-md p-3">
          <Input
            placeholder="Hesap adı (ör. İş Bankası USD 1)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Banka tipi" />
              </SelectTrigger>
              <SelectContent>
                {BANK_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newCompanyId} onValueChange={setNewCompanyId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Şirket seçin" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} className="gap-1 w-full">
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
                    <BankIcon type={b.bank_type} size={24} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm block truncate">{b.name}</span>
                      <span className="text-[11px] text-muted-foreground">{bankTypeLabel(b.bank_type)}</span>
                    </div>
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
