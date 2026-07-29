"use client"

import { useState } from "react"
import { Plus, Building2, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CompanyForm } from "@/components/company-form"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { DataLabel } from "@/components/data-label"

interface Company {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  tax_number: string | null
  created_at: string
}

interface CompanyListProps {
  initialCompanies: Company[]
}

export function CompanyList({ initialCompanies }: CompanyListProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleCompanyCreated = (newCompany: Company) => {
    setCompanies([newCompany, ...companies])
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu şirketi silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCompanies(companies.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error("[v0] Delete company error:", error)
    }
  }

  const filteredCompanies = companies.filter((company) => {
    const query = searchQuery.toLowerCase()
    return (
      company.name.toLowerCase().includes(query) ||
      company.email?.toLowerCase().includes(query) ||
      company.tax_number?.toLowerCase().includes(query)
    )
  })

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Şirket adı, email veya vergi numarası ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Şirket Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Şirket Oluştur</DialogTitle>
            </DialogHeader>
            <CompanyForm onSuccess={handleCompanyCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {filteredCompanies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "Arama sonucu bulunamadı" : "Henüz şirket eklemediniz"}
          description={searchQuery ? "Farklı arama terimleri deneyin" : "İlk şirketinizi ekleyerek başlayın"}
          action={
            !searchQuery
              ? {
                  label: "İlk Şirketinizi Ekleyin",
                  onClick: () => setIsDialogOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="group hover:border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="truncate">{company.name}</span>
                </CardTitle>
                {company.email && <CardDescription className="truncate">{company.email}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 pb-4 border-b border-border/50">
                  {company.phone && <DataLabel label="Telefon" value={company.phone} />}
                  {company.tax_number && <DataLabel label="Vergi No" value={company.tax_number} />}
                </div>
                {company.address && <div className="text-xs text-muted-foreground line-clamp-2">{company.address}</div>}
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Link href={`/dashboard/companies/${company.id}`}>Detaylar</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(company.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
