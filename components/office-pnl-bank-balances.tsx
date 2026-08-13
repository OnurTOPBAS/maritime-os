"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Wallet, Edit2, Save } from "lucide-react"
import { toast } from "sonner"

interface BankBalance {
  id: string
  bank_id: string
  bank_name: string
  report_month: string
  balance_tl: number
  balance_usd: number
  closing_balance_aed?: number
}

interface PayeeBank {
  id: string
  name: string
}

interface OfficePnlBankBalancesProps {
  reportMonth: string
}

export function OfficePnlBankBalances({ reportMonth }: OfficePnlBankBalancesProps) {
  const [balances, setBalances] = useState<BankBalance[]>([])
  const [banks, setBanks] = useState<PayeeBank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    bankId: "",
    balanceTl: "",
    balanceUsd: "",
    balanceAed: "",
  })

  useEffect(() => {
    fetchData()
  }, [reportMonth])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [balancesRes, banksRes] = await Promise.all([
        fetch(`/api/office-pnl/bank-balances?reportMonth=${reportMonth}`),
        fetch("/api/office-pnl/payee-banks"),
      ])

      if (balancesRes.ok) {
        const data = await balancesRes.json()
        // Normalize bank_name from different possible field names
        const normalized = (Array.isArray(data) ? data : []).map((b: any) => ({
          ...b,
          bank_name: b.bank_name || b.bank_name_ref || "Unknown",
        }))
        setBalances(normalized)
      }

      if (banksRes.ok) {
        const data = await banksRes.json()
        setBanks(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBalance = async () => {
    try {
      const selectedBank = banks.find(b => b.id === formData.bankId)
      const response = await fetch("/api/office-pnl/bank-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankId: formData.bankId,
          bankName: selectedBank?.name || null,
          reportMonth,
          balanceTl: parseFloat(formData.balanceTl) || 0,
          balanceUsd: parseFloat(formData.balanceUsd) || 0,
          balanceAed: parseFloat(formData.balanceAed) || 0,
        }),
      })

      const text = await response.text()
      if (response.ok) {
        toast.success("Bakiye kaydedildi")
        setIsDialogOpen(false)
        setEditingBank(null)
        setFormData({ bankId: "", balanceTl: "", balanceUsd: "", balanceAed: "" })
        fetchData()
      } else {
        let errorMessage = "Kayıt başarısız"
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      toast.error("Bir hata oluştu")
    }
  }

  const handleEditBalance = (balance: BankBalance) => {
    setFormData({
      bankId: balance.bank_id,
      balanceTl: String(balance.balance_tl || 0),
      balanceUsd: String(balance.balance_usd || 0),
      balanceAed: String(balance.closing_balance_aed || 0),
    })
    setEditingBank(balance.bank_id)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setFormData({ bankId: "", balanceTl: "", balanceUsd: "", balanceAed: "" })
    setEditingBank(null)
    setIsDialogOpen(true)
  }

  // Calculate totals
  const totalTl = balances.reduce((sum, b) => sum + (Number(b.balance_tl) || 0), 0)
  const totalUsd = balances.reduce((sum, b) => sum + (Number(b.balance_usd) || 0), 0)

  // Get banks that don't have balances yet
  const banksWithoutBalance = banks.filter(
    bank => !balances.some(b => b.bank_id === bank.id)
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Hesap Bakiyeleri
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={handleAddNew}>
                <Wallet className="h-4 w-4 mr-1" />
                Bakiye Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBank ? "Bakiye Düzenle" : "Yeni Bakiye Ekle"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Banka / Kasa</Label>
                  <Select
                    value={formData.bankId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, bankId: value }))
                    }
                    disabled={!!editingBank}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {editingBank ? (
                        banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))
                      ) : (
                        banksWithoutBalance.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>TL Bakiye</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.balanceTl}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, balanceTl: e.target.value }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>USD Bakiye</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.balanceUsd}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, balanceUsd: e.target.value }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>AED Bakiye</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.balanceAed}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, balanceAed: e.target.value }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveBalance}
                  disabled={!formData.bankId}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>
        ) : balances.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Bu ay için bakiye kaydı bulunmuyor
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map((balance) => (
              <div
                key={balance.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {balance.bank_name === "Cash" ? (
                      <Wallet className="h-4 w-4 text-primary" />
                    ) : (
                      <Building2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="font-medium">{balance.bank_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Number(balance.balance_tl).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      TL
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${Number(balance.balance_usd).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEditBalance(balance)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between font-semibold">
                <span>Toplam</span>
                <div className="text-right">
                  <div>
                    {totalTl.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
