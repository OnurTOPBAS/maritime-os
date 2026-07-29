"use client"

import { useState } from "react"
import { Ship, Plus, Anchor, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShipForm } from "@/components/ship-form"
import { FleetBanksSection } from "@/components/fleet-banks-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedShipCard } from "@/components/enhanced-ship-card"
import { ShipCardSettingsButton, useShipCardSettings } from "@/components/ship-card-settings"
import { useToastNotification } from "@/components/toast-provider"
import { useRouter } from "next/navigation"

interface Fleet {
  id: string
  name: string
  description: string | null
  company_name: string
}

interface ShipData {
  id: string
  fleet_id: string
  name: string
  imo_number: string | null
  flag: string | null
  vessel_type: string | null
  dwt: number | null
  built_year: number | null
  status: string
  created_at: string
}

interface FleetDetailViewProps {
  fleet: Fleet
  initialShips: ShipData[]
}

export function FleetDetailView({ fleet, initialShips }: FleetDetailViewProps) {
  const [ships, setShips] = useState<ShipData[]>(initialShips)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingShip, setEditingShip] = useState<ShipData | null>(null)
  const { settings, updateSettings } = useShipCardSettings()
  const toast = useToastNotification()
  const router = useRouter()

  const handleShipCreated = (newShip: ShipData) => {
    setShips([newShip, ...ships])
    setIsDialogOpen(false)
  }

  const handleShipUpdated = (updatedShip: ShipData) => {
    setShips(ships.map((s) => (s.id === updatedShip.id ? updatedShip : s)))
    setEditDialogOpen(false)
    setEditingShip(null)
  }

  const handleEdit = (ship: ShipData) => {
    setEditingShip(ship)
    setEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu gemiyi silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/ships/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setShips(ships.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error("[v0] Delete ship error:", error)
    }
  }

  const handleCopyFleet = async () => {
    try {
      const response = await fetch(`/api/fleets/${fleet.id}/copy`, {
        method: "POST",
      })

      if (response.ok) {
        const copiedFleet = await response.json()
        toast.success("Filo kopyalandı", "Filo başarıyla kopyalandı")
        router.push(`/dashboard/fleets/${copiedFleet.id}`)
      } else {
        console.error("[v0] Copy fleet failed:", await response.text())
        toast.error("Kopyalama başarısız", "Filo kopyalanırken bir hata oluştu")
      }
    } catch (error) {
      console.error("[v0] Copy fleet error:", error)
      toast.error("Kopyalama başarısız", "Filo kopyalanırken bir hata oluştu")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Ship className="h-6 w-6" />
                {fleet.name}
              </CardTitle>
              <CardDescription>
                {fleet.company_name} - {fleet.description || "Filo Detayları"}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleCopyFleet} title="Filoyu Kopyala">
              <Copy className="h-4 w-4 mr-2" />
              Filoyu Kopyala
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="ships" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ships">Gemiler</TabsTrigger>
          <TabsTrigger value="banks">Bankalar</TabsTrigger>
        </TabsList>

        <TabsContent value="ships" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Gemiler</h2>
              <p className="text-muted-foreground">Filoya ait gemiler</p>
            </div>
            <div className="flex gap-2">
              <ShipCardSettingsButton settings={settings} onSettingsChange={updateSettings} />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Gemi Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Yeni Gemi Ekle</DialogTitle>
                  </DialogHeader>
                  <ShipForm fleetId={fleet.id} onSuccess={handleShipCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {ships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Anchor className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Henüz gemi eklemediniz</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Geminizi Ekleyin
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ships.map((ship) => (
                <EnhancedShipCard
                  key={ship.id}
                  ship={ship}
                  settings={settings}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="banks">
          <FleetBanksSection fleetId={fleet.id} />
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gemi Düzenle</DialogTitle>
          </DialogHeader>
          {editingShip && <ShipForm fleetId={fleet.id} ship={editingShip} onSuccess={handleShipUpdated} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
