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
import { Building2, Wallet, Edit2, Save, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { OfficePnlBankManager } from "@/components/office-pnl-bank-manager"
import { BankIcon, bankTypeLabel } from "@/components/bank-icon"

interface BankBalance {
  id: string
  bank_id: string
  bank_name: string
  bank_type?: string
  report_month: string
  balance_tl: number
  balance_usd: number
  opening_balance_tl?: number
  opening_balance_usd?: number
  opening_balance_aed?: number
  net_tl?: number
  net_usd?: number
  closing_balance_tl?: number
  closing_balance_usd?: number
  closing_balance_aed?: number
}

interface CompanyOpt {
  id: string
  name: string
}

interface PayeeBank {
  id: string
  name: string
}

interface OfficePnlBankBalancesProps {
  reportMonth: string
  refreshKey?: number
  onChanged?: () => void
}

export function OfficePnlBankBalances({ reportMonth, refreshKey = 0, onChanged }: OfficePnlBankBalancesProps) {
  const [balances, setBalances] = useState<BankBalance[]>([])
  const [banks, setBanks] = useState<PayeeBank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Açılır/kapanır — varsayılan kapalı, tuşa basınca liste görünür.
  const [isOpen, setIsOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<string | null>(null)
  const [companies, setCompanies] = useState<CompanyOpt[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [formData, setFormData] = useState({
    bankId: "",
    balanceTl: "",
    balanceUsd: "",
    balanceAed: "",
  })

  // Şirket listesini bir kez çek (filtre için).
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCompanies(Array.isArray(d) ? d.map((c: any) => ({ id: c.id, name: c.name })) : []))
      .catch(() => setCompanies([]))
  }, [])

  useEffect(() => {
    fetchData()
  }, [reportMonth, refreshKey, selectedCompany])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const companyParam = selectedCompany !== "all" ? `&companyId=${selectedCompany}` : ""
      const [balancesRes, banksRes] = await Promise.all([
        fetch(`/api/office-pnl/bank-balances?reportMonth=${reportMonth}${companyParam}`),
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
          openingTl: parseFloat(formData.balanceTl) || 0,
          openingUsd: parseFloat(formData.balanceUsd) || 0,
          openingAed: parseFloat(formData.balanceAed) || 0,
        }),
      })

      const text = await response.text()
      if (response.ok) {
        toast.success("Bakiye kaydedildi")
        setIsDialogOpen(false)
        setEditingBank(null)
        setFormData({ bankId: "", balanceTl: "", balanceUsd: "", balanceAed: "" })
        fetchData()
        onChanged?.()
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
      balanceTl: String(balance.opening_balance_tl ?? 0),
      balanceUsd: String(balance.opening_balance_usd ?? 0),
      balanceAed: String(balance.opening_balance_aed ?? 0),
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
  const totalTl = balances.reduce((sum, b) => sum + (Number(b.closing_balance_tl ?? b.balance_tl) || 0), 0)
  const totalUsd = balances.reduce((sum, b) => sum + (Number(b.closing_balance_usd ?? b.balance_usd) || 0), 0)

  // Get banks that don't have balances yet
  const banksWithoutBalance = banks.filter(
    bank => !balances.some(b => b.bank_id === bank.id)
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Başlığa tıklayınca aç/kapa */}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-2 text-lg font-semibold hover:opacity-80 transition-opacity"
          >
            {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <Building2 className="h-5 w-5" />
            Hesap Bakiyeleri
            {/* Kapalıyken toplamı küçük bir ipucu olarak göster */}
            {!isOpen && !isLoading && balances.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })})
              </span>
            )}
          </button>
          <div className="flex items-center gap-1" style={{ display: isOpen ? undefined : "none" }}>
          <OfficePnlBankManager onChanged={() => { fetchData(); onChanged?.() }} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={handleAddNew}>
                <Wallet className="h-4 w-4 mr-1" />
                Açılış Bakiyesi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBank ? "Açılış Bakiyesini Düzenle" : "Açılış Bakiyesi Gir"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground pt-1">
                  Bu ayın <strong>başlangıç</strong> (açılış) bakiyesi. Genelde sadece
                  takibe başladığın ilk ay girilir; sonraki aylar önceki ayın kalanından
                  otomatik devreder. Ödenen giderler bu bakiyeden otomatik düşer.
                </p>
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
                    <Label>Açılış TL</Label>
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
                    <Label>Açılış USD</Label>
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
                    <Label>Açılış AED</Label>
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
        </div>
      </CardHeader>
      {isOpen && (
      <CardContent>
        {/* Şirket filtresi — sadece birden çok şirkete erişimin varsa */}
        {companies.length > 1 && (
          <div className="mb-4 max-w-xs">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tüm Şirketler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şirketler</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>
        ) : balances.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Bu ay için bakiye kaydı bulunmuyor
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map((balance, i) => {
              const prev = balances[i - 1]
              const showGroup = !prev || prev.bank_type !== balance.bank_type
              return (
              <div key={balance.id}>
              {showGroup && (
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground pt-2 pb-1">
                  {bankTypeLabel(balance.bank_type)}
                </div>
              )}
              <div
                className="flex items-center justify-between px-3 py-1.5 bg-muted/50 rounded-lg [&_div]:leading-[1.15]"
              >
                <div className="flex items-center gap-3">
                  <BankIcon type={balance.bank_type} size={28} />
                  <span className="font-medium">{balance.bank_name}</span>
                </div>
                <div className="flex items-center gap-6">
                  {/* Açılış (devir) */}
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Açılış</div>
                    <div className="text-xs">
                      ${Number(balance.opening_balance_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  {/* Bu ay hareket (net) */}
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Bu Ay</div>
                    <div className={`text-xs ${Number(balance.net_usd ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                      {Number(balance.net_usd ?? 0) >= 0 ? "+" : ""}
                      ${Number(balance.net_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  {/* Kalan (kapanış) */}
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Kalan</div>
                    <div className="text-sm font-semibold">
                      ${Number(balance.closing_balance_usd ?? balance.balance_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Number(balance.closing_balance_tl ?? balance.balance_tl ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                      {Number(balance.closing_balance_aed ?? 0) !== 0 &&
                        ` · ${Number(balance.closing_balance_aed).toLocaleString("en-US", { minimumFractionDigits: 2 })} AED`}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEditBalance(balance)}
                    title="Açılış bakiyesini düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              </div>
              )
            })}

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
      )}
    </Card>
  )
}
