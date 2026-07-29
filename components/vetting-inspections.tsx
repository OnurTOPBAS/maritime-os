"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, FileText, TrendingUp, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VettingInspectionsProps {
  shipId: string
}

export function VettingInspections({ shipId }: VettingInspectionsProps) {
  const { toast } = useToast()
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deficiencyDialogOpen, setDeficiencyDialogOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [formData, setFormData] = useState({
    vettingType: "SIRE",
    inspectionDate: "",
    port: "",
    inspectorCompany: "",
    inspectorName: "",
    score: "",
    notes: "",
  })
  const [deficiencyForm, setDeficiencyForm] = useState({
    category: "",
    observation: "",
    actionTaken: "",
  })
  const [viewObservationsDialog, setViewObservationsDialog] = useState(false)
  const [observations, setObservations] = useState<any[]>([])
  const [loadingObservations, setLoadingObservations] = useState(false)

  useEffect(() => {
    fetchInspections()
  }, [shipId])

  const fetchInspections = async () => {
    try {
      console.log("[v0] Fetching vetting inspections for ship:", shipId)
      const response = await fetch(`/api/ships/${shipId}/vetting`)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Vetting inspections loaded:", data)
        setInspections(data)
      } else {
        console.error("[v0] Failed to fetch vetting inspections:", response.status)
      }
    } catch (error) {
      console.error("[v0] Fetch vetting inspections error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log("[v0] Submitting vetting inspection:", formData)
      const response = await fetch(`/api/ships/${shipId}/vetting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newInspection = await response.json()
        console.log("[v0] Vetting inspection created:", newInspection)
        fetchInspections()
        setDialogOpen(false)
        setFormData({
          vettingType: "SIRE",
          inspectionDate: "",
          port: "",
          inspectorCompany: "",
          inspectorName: "",
          score: "",
          notes: "",
        })
        toast({
          title: "Başarılı",
          description: "Vetting kaydı eklendi",
        })
      } else {
        const error = await response.json()
        console.error("[v0] Failed to create vetting inspection:", error)
        toast({
          title: "Hata",
          description: error.error || "Kayıt eklenemedi",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Create vetting inspection error:", error)
      toast({
        title: "Hata",
        description: "Kayıt eklenemedi",
        variant: "destructive",
      })
    }
  }

  const handleDeficiencySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedInspection) return

    try {
      console.log("[v0] Submitting deficiency:", deficiencyForm)
      const response = await fetch(`/api/ships/${shipId}/vetting/${selectedInspection.id}/deficiencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deficiencyForm),
      })

      if (response.ok) {
        console.log("[v0] Deficiency added successfully")
        fetchInspections()
        setDeficiencyDialogOpen(false)
        setDeficiencyForm({
          category: "",
          observation: "",
          actionTaken: "",
        })
        toast({
          title: "Başarılı",
          description: "Gözlem eklendi",
        })
      } else {
        const error = await response.json()
        console.error("[v0] Failed to add deficiency:", error)
        toast({
          title: "Hata",
          description: error.error || "Gözlem eklenemedi",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Add deficiency error:", error)
      toast({
        title: "Hata",
        description: "Gözlem eklenemedi",
        variant: "destructive",
      })
    }
  }

  const handleViewObservations = async (inspection: any) => {
    setSelectedInspection(inspection)
    setViewObservationsDialog(true)
    setLoadingObservations(true)

    try {
      const response = await fetch(`/api/ships/${shipId}/vetting/${inspection.id}/deficiencies`)
      if (response.ok) {
        const data = await response.json()
        setObservations(data)
      } else {
        toast({
          title: "Hata",
          description: "Gözlemler yüklenemedi",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Fetch observations error:", error)
      toast({
        title: "Hata",
        description: "Gözlemler yüklenemedi",
        variant: "destructive",
      })
    } finally {
      setLoadingObservations(false)
    }
  }

  const getVettingTypeBadge = (type: string) => {
    const colors: any = {
      SIRE: "bg-blue-600",
      CDI: "bg-green-600",
      RIGHTSHIP: "bg-purple-600",
      Other: "bg-gray-600",
    }
    return <Badge className={`${colors[type] || "bg-gray-600"} text-xs`}>{type}</Badge>
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600 text-xs">{score}</Badge>
    if (score >= 70) return <Badge className="bg-yellow-600 text-xs">{score}</Badge>
    return (
      <Badge variant="destructive" className="text-xs">
        {score}
      </Badge>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                Vetting Denetimleri
              </CardTitle>
              <CardDescription className="text-sm">SIRE, CDI, RIGHTSHIP ve diğer vetting denetimleri</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kayıt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">Vetting Denetimi Ekle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Vetting Tipi</Label>
                      <Select
                        value={formData.vettingType}
                        onValueChange={(value) => setFormData({ ...formData, vettingType: value })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SIRE">SIRE</SelectItem>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="RIGHTSHIP">RIGHTSHIP</SelectItem>
                          <SelectItem value="Other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Denetim Tarihi</Label>
                      <Input
                        type="date"
                        value={formData.inspectionDate}
                        onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Liman</Label>
                      <Input
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                        placeholder="Örn: Rotterdam"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Denetim Şirketi</Label>
                      <Input
                        value={formData.inspectorCompany}
                        onChange={(e) => setFormData({ ...formData, inspectorCompany: e.target.value })}
                        placeholder="Örn: Shell"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Denetçi Adı</Label>
                      <Input
                        value={formData.inspectorName}
                        onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Skor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.score}
                        onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                        placeholder="0-100"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Notlar</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Kaydet
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Henüz vetting kaydı yok</p>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Liman</TableHead>
                      <TableHead>Denetim Şirketi</TableHead>
                      <TableHead>Gözlem</TableHead>
                      <TableHead>Skor</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell>{new Date(inspection.inspection_date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>{getVettingTypeBadge(inspection.vetting_type)}</TableCell>
                        <TableCell>{inspection.port || "N/A"}</TableCell>
                        <TableCell>{inspection.inspector_company || "N/A"}</TableCell>
                        <TableCell>{inspection.observations_count || 0}</TableCell>
                        <TableCell>
                          {inspection.score ? getScoreBadge(Number.parseFloat(inspection.score)) : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewObservations(inspection)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Görüntüle
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedInspection(inspection)
                                setDeficiencyDialogOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Gözlem Ekle
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {new Date(inspection.inspection_date).toLocaleDateString("tr-TR")}
                      </span>
                      {getVettingTypeBadge(inspection.vetting_type)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Liman: {inspection.port || "N/A"}</div>
                      <div>Şirket: {inspection.inspector_company || "N/A"}</div>
                      <div>Gözlem: {inspection.observations_count || 0}</div>
                    </div>
                    {inspection.score && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Skor:</span>
                        {getScoreBadge(Number.parseFloat(inspection.score))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => handleViewObservations(inspection)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Görüntüle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setSelectedInspection(inspection)
                          setDeficiencyDialogOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Gözlem Ekle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog to view observations */}
      <Dialog open={viewObservationsDialog} onOpenChange={setViewObservationsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Gözlemler - {selectedInspection?.vetting_type} (
              {new Date(selectedInspection?.inspection_date || "").toLocaleDateString("tr-TR")})
            </DialogTitle>
          </DialogHeader>
          {loadingObservations ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : observations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz gözlem eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-4">
              {observations.map((obs, index) => (
                <Card key={obs.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">Gözlem #{index + 1}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {obs.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Gözlem:</p>
                      <p className="text-sm">{obs.observation}</p>
                    </div>
                    {obs.action_taken && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Alınan Aksiyon:</p>
                        <p className="text-sm">{obs.action_taken}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <span>Durum: {obs.is_closed ? "Kapalı" : "Açık"}</span>
                      <span>Tarih: {new Date(obs.created_at).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Existing deficiency dialog */}
      <Dialog open={deficiencyDialogOpen} onOpenChange={setDeficiencyDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Gözlem/Deficiency Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeficiencySubmit} className="space-y-4">
            <div>
              <Label className="text-sm">Kategori</Label>
              <Input
                value={deficiencyForm.category}
                onChange={(e) => setDeficiencyForm({ ...deficiencyForm, category: e.target.value })}
                placeholder="Örn: Safety Equipment, Documentation"
                required
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Gözlem/Deficiency</Label>
              <Textarea
                value={deficiencyForm.observation}
                onChange={(e) => setDeficiencyForm({ ...deficiencyForm, observation: e.target.value })}
                rows={3}
                required
                className="text-sm"
                placeholder="Tespit edilen eksiklik veya gözlem"
              />
            </div>
            <div>
              <Label className="text-sm">Alınan Aksiyon</Label>
              <Textarea
                value={deficiencyForm.actionTaken}
                onChange={(e) => setDeficiencyForm({ ...deficiencyForm, actionTaken: e.target.value })}
                rows={3}
                className="text-sm"
                placeholder="Yapılan düzeltme veya alınan önlem"
              />
            </div>
            <Button type="submit" className="w-full">
              Kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
