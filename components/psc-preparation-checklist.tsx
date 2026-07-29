"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ClipboardCheck, AlertCircle, CheckCircle2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PSCPreparationChecklistProps {
  shipId: string
}

export function PSCPreparationChecklist({ shipId }: PSCPreparationChecklistProps) {
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchData()
  }, [shipId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/ships/${shipId}/psc-preparation`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("[v0] Fetch PSC preparation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckboxChange = async (item: any, checked: boolean) => {
    try {
      const response = await fetch(`/api/ships/${shipId}/psc-preparation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistItemId: item.id,
          isCompleted: checked,
          notes: item.completion_notes || "",
        }),
      })

      if (response.ok) {
        fetchData()
        toast({
          title: checked ? "İşaretlendi" : "İşaret kaldırıldı",
          description: item.item_name,
        })
      }
    } catch (error) {
      console.error("[v0] Update checklist error:", error)
      toast({
        title: "Hata",
        description: "Güncelleme başarısız",
        variant: "destructive",
      })
    }
  }

  const handleAddNote = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/ships/${shipId}/psc-preparation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistItemId: selectedItem.id,
          isCompleted: selectedItem.is_completed || false,
          notes,
        }),
      })

      if (response.ok) {
        fetchData()
        setSelectedItem(null)
        setNotes("")
        toast({
          title: "Not eklendi",
          description: "Başarıyla kaydedildi",
        })
      }
    } catch (error) {
      console.error("[v0] Add note error:", error)
      toast({
        title: "Hata",
        description: "Not eklenemedi",
        variant: "destructive",
      })
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            Yüksek
          </Badge>
        )
      case "medium":
        return <Badge className="bg-yellow-600 text-xs">Orta</Badge>
      case "low":
        return (
          <Badge variant="secondary" className="text-xs">
            Düşük
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  if (!data) {
    return <div className="text-center py-8">Veri yüklenemedi</div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <ClipboardCheck className="h-4 w-4 md:h-5 md:w-5" />
            PSC Hazırlık Kontrol Listesi
          </CardTitle>
          <CardDescription className="text-sm">
            Port State Control denetimi öncesi kontrol edilmesi gerekenler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs md:text-sm font-medium">Tamamlanma Oranı</span>
                <span className="text-xl md:text-2xl font-bold text-primary">{data.stats.percentage}%</span>
              </div>
              <Progress value={data.stats.percentage} className="h-2 md:h-3" />
              <div className="flex flex-col sm:flex-row justify-between gap-1 text-xs md:text-sm text-muted-foreground mt-2">
                <span>
                  {data.stats.completed} / {data.stats.total} madde tamamlandı
                </span>
                <span>{data.stats.total - data.stats.completed} madde kaldı</span>
              </div>
            </div>

            {data.stats.percentage === 100 && (
              <div className="flex items-start gap-2 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-green-700 font-medium text-xs md:text-sm">
                  Tüm kontroller tamamlandı! PSC denetimine hazır.
                </span>
              </div>
            )}

            {data.stats.percentage < 100 && (
              <div className="flex items-start gap-2 p-3 md:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <span className="text-orange-700 text-xs md:text-sm">
                  Lütfen tüm maddeleri kontrol edin ve PSC denetimi öncesi eksiklikleri tamamlayın.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 md:p-6">
          <Accordion type="multiple" className="w-full">
            {Object.entries(data.checklist).map(([category, items]: [string, any]) => {
              const categoryItems = items as any[]
              const completedInCategory = categoryItems.filter((item) => item.is_completed).length
              const totalInCategory = categoryItems.length
              const categoryPercentage = Math.round((completedInCategory / totalInCategory) * 100)

              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-2 md:pr-4 gap-2">
                      <span className="font-semibold text-sm md:text-base">{category}</span>
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-xs md:text-sm text-muted-foreground">
                          {completedInCategory}/{totalInCategory}
                        </span>
                        <div className="w-16 md:w-24">
                          <Progress value={categoryPercentage} className="h-1.5 md:h-2" />
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 md:space-y-3 pt-2">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            checked={item.is_completed || false}
                            onCheckedChange={(checked) => handleCheckboxChange(item, checked as boolean)}
                            className="mt-0.5 md:mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium text-sm md:text-base ${item.is_completed ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {item.item_name}
                                </p>
                                {item.description && (
                                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{item.description}</p>
                                )}
                                {item.regulatory_reference && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Referans: {item.regulatory_reference}
                                  </p>
                                )}
                                {item.completion_notes && (
                                  <p className="text-xs md:text-sm text-blue-600 mt-2 italic">
                                    Not: {item.completion_notes}
                                  </p>
                                )}
                                {item.is_completed && item.completed_by_name && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Tamamlayan: {item.completed_by_name} -{" "}
                                    {new Date(item.completed_date).toLocaleDateString("tr-TR")}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {getPriorityBadge(item.priority)}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedItem(item)
                                        setNotes(item.completion_notes || "")
                                      }}
                                    >
                                      <FileText className="h-3 w-3 md:h-4 md:w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[95vw] sm:max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle className="text-base md:text-lg">Not Ekle</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <p className="font-medium mb-2 text-sm md:text-base">{item.item_name}</p>
                                        <Textarea
                                          value={notes}
                                          onChange={(e) => setNotes(e.target.value)}
                                          placeholder="Notlarınızı buraya yazın..."
                                          rows={4}
                                          className="text-sm"
                                        />
                                      </div>
                                      <Button onClick={handleAddNote} className="w-full">
                                        Kaydet
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
