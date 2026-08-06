"use client"

import { useState } from "react"
import { Building2, Plus, Ship, Trash2, Users, Pencil } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FleetForm } from "@/components/fleet-form"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamManagement } from "@/components/team-management"
import type { Fleet } from "@/types/models"

interface Company {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  tax_number: string | null
}


interface CompanyDetailViewProps {
  company: Company
  initialFleets: Fleet[]
}

export function CompanyDetailView({ company, initialFleets }: CompanyDetailViewProps) {
  const [fleets, setFleets] = useState<Fleet[]>(initialFleets)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null)

  const handleFleetCreated = (newFleet: Fleet) => {
    setFleets([newFleet, ...fleets])
    setIsDialogOpen(false)
  }

  const handleFleetUpdated = (updatedFleet: Fleet) => {
    setFleets(fleets.map((f) => (f.id === updatedFleet.id ? updatedFleet : f)))
    setIsDialogOpen(false)
    setEditingFleet(null)
  }

  const handleEdit = (fleet: Fleet) => {
    setEditingFleet(fleet)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu filoyu silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/fleets/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFleets(fleets.filter((f) => f.id !== id))
      }
    } catch (error) {
      console.error("[v0] Delete fleet error:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Building2 className="h-6 w-6" />
            {company.name}
          </CardTitle>
          <CardDescription>Şirket Detayları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {company.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{company.email}</p>
              </div>
            )}
            {company.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                <p>{company.phone}</p>
              </div>
            )}
            {company.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adres</p>
                <p>{company.address}</p>
              </div>
            )}
            {company.tax_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vergi Numarası</p>
                <p>{company.tax_number}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="fleets" className="w-full">
        <TabsList>
          <TabsTrigger value="fleets">Filolar</TabsTrigger>
          <TabsTrigger value="team">Takım</TabsTrigger>
        </TabsList>
        <TabsContent value="fleets" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Filolar</h2>
              <p className="text-muted-foreground">Şirkete ait filo şirketleri</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingFleet(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Filo Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFleet ? "Filo Düzenle" : "Yeni Filo Oluştur"}</DialogTitle>
                </DialogHeader>
                <FleetForm
                  companyId={company.id}
                  fleet={editingFleet || undefined}
                  onSuccess={editingFleet ? handleFleetUpdated : handleFleetCreated}
                />
              </DialogContent>
            </Dialog>
          </div>

          {fleets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ship className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Henüz filo eklemediniz</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Filonuzu Ekleyin
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fleets.map((fleet) => (
                <Card key={fleet.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ship className="h-5 w-5" />
                      {fleet.name}
                    </CardTitle>
                    {fleet.description && <CardDescription>{fleet.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Link href={`/dashboard/fleets/${fleet.id}`}>Gemileri Gör</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(fleet)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(fleet.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold">Takım Yönetimi</h2>
              <p className="text-muted-foreground">Şirket takım üyelerini yönetin</p>
            </div>
          </div>
          <TeamManagement companyId={company.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
