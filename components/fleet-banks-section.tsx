"use client"

import { useState, useEffect } from "react"
import { Building2, Plus, Copy, Trash2, CreditCard, Mail, Phone, User, Download, Pencil } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FleetBankForm } from "@/components/fleet-bank-form"
import { BankAccountForm } from "@/components/bank-account-form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { FleetBank, BankAccount } from "@/types/models"



interface FleetBanksSectionProps {
  fleetId: string
}

export function FleetBanksSection({ fleetId }: FleetBanksSectionProps) {
  const [banks, setBanks] = useState<FleetBank[]>([])
  const [loading, setLoading] = useState(true)
  const [bankDialogOpen, setBankDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<FleetBank | null>(null)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

  useEffect(() => {
    fetchBanks()
  }, [fleetId])

  const fetchBanks = async () => {
    try {
      const response = await fetch(`/api/fleet-banks?fleetId=${fleetId}`)
      if (response.ok) {
        const data = await response.json()
        setBanks(data)
      }
    } catch (error) {
      console.error("[v0] Fetch banks error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBankCreated = (newBank: FleetBank) => {
    setBanks([newBank, ...banks])
    setBankDialogOpen(false)
    setEditingBank(null)
  }

  const handleBankUpdated = (updatedBank: FleetBank) => {
    setBanks(banks.map((b) => (b.id === updatedBank.id ? { ...b, ...updatedBank } : b)))
    setBankDialogOpen(false)
    setEditingBank(null)
  }

  const handleCopyBank = async (bankId: string) => {
    try {
      const response = await fetch(`/api/fleet-banks/${bankId}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        fetchBanks()
      }
    } catch (error) {
      console.error("[v0] Copy bank error:", error)
    }
  }

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm("Bu bankayı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/fleet-banks/${bankId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setBanks(banks.filter((b) => b.id !== bankId))
      }
    } catch (error) {
      console.error("[v0] Delete bank error:", error)
    }
  }

  const handleAccountCreated = () => {
    fetchBanks()
    setAccountDialogOpen(false)
    setSelectedBankId(null)
  }

  const handleAccountUpdated = () => {
    fetchBanks()
    setAccountDialogOpen(false)
    setEditingAccount(null)
  }

  const handleCopyAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/bank-accounts/${accountId}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        fetchBanks()
      }
    } catch (error) {
      console.error("[v0] Copy account error:", error)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Bu hesabı silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/bank-accounts/${accountId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchBanks()
      }
    } catch (error) {
      console.error("[v0] Delete account error:", error)
    }
  }

  const handleExportBanks = () => {
    const csvContent = banks
      .map((bank) => {
        const accounts = bank.accounts || []
        return accounts
          .map(
            (account) =>
              `${bank.bank_name},${bank.bank_code || ""},${bank.swift_code || ""},${bank.branch_name || ""},${bank.relationship_manager_name || ""},${bank.relationship_manager_email || ""},${bank.relationship_manager_phone || ""},${account.account_name},${account.account_number},${account.currency},${account.iban || ""},${account.account_type || ""},${account.is_active ? "Aktif" : "Pasif"}`,
          )
          .join("\n")
      })
      .join("\n")

    const header =
      "Banka Adı,Banka Kodu,SWIFT,Şube,İlişki Yöneticisi,Email,Telefon,Hesap Adı,Hesap No,Para Birimi,IBAN,Hesap Tipi,Durum\n"
    const blob = new Blob([header + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `bankalar-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account)
    setAccountDialogOpen(true)
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bankalar</h2>
          <p className="text-muted-foreground">Filo banka bilgileri ve hesapları</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportBanks} disabled={banks.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBank(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Banka Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBank ? "Banka Düzenle" : "Yeni Banka Ekle"}</DialogTitle>
              </DialogHeader>
              <FleetBankForm
                fleetId={fleetId}
                bank={editingBank || undefined}
                onSuccess={editingBank ? handleBankUpdated : handleBankCreated}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {banks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Henüz banka eklemediniz</p>
            <Button onClick={() => setBankDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Bankanızı Ekleyin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {banks.map((bank) => (
            <Card key={bank.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {bank.bank_name}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      {bank.bank_code && <div>Banka Kodu: {bank.bank_code}</div>}
                      {bank.swift_code && <div>SWIFT: {bank.swift_code}</div>}
                      {bank.branch_name && <div>Şube: {bank.branch_name}</div>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingBank(bank)
                        setBankDialogOpen(true)
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopyBank(bank.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteBank(bank.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {bank.relationship_manager_name && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      İlişki Yöneticisi
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>{bank.relationship_manager_name}</p>
                      {bank.relationship_manager_email && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {bank.relationship_manager_email}
                        </p>
                      )}
                      {bank.relationship_manager_phone && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {bank.relationship_manager_phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Hesaplar
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBankId(bank.id)
                        setAccountDialogOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Hesap Ekle
                    </Button>
                  </div>

                  {bank.accounts && bank.accounts.length > 0 ? (
                    <div className="space-y-2">
                      {bank.accounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{account.account_name}</p>
                              <Badge variant={account.is_active ? "default" : "secondary"}>
                                {account.is_active ? "Aktif" : "Pasif"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {account.account_number} • {account.currency}
                            </p>
                            {account.iban && <p className="text-xs text-muted-foreground mt-1">IBAN: {account.iban}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditAccount(account)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyAccount(account.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAccount(account.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Henüz hesap eklenmemiş</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Hesap Düzenle" : "Yeni Hesap Ekle"}</DialogTitle>
          </DialogHeader>
          {selectedBankId && (
            <BankAccountForm
              bankId={selectedBankId}
              account={editingAccount || undefined}
              onSuccess={editingAccount ? handleAccountUpdated : handleAccountCreated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
