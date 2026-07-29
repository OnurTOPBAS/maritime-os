"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Save, FileText, Trash2 } from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  ship_name: string
  created_at: string
}

interface VoyageCalculatorTemplatesProps {
  onLoadTemplate: (templateId: string) => void
  currentCalculation?: any
}

export function VoyageCalculatorTemplates({ onLoadTemplate, currentCalculation }: VoyageCalculatorTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/voyage-calculator/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("[v0] Fetch templates error:", error)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName || !currentCalculation) return

    setSaving(true)
    try {
      const response = await fetch("/api/voyage-calculator/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          ...currentCalculation,
        }),
      })

      if (response.ok) {
        setShowSaveDialog(false)
        setTemplateName("")
        setTemplateDescription("")
        fetchTemplates()
      }
    } catch (error) {
      console.error("[v0] Save template error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Bu şablonu silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/voyage-calculator/templates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error("[v0] Delete template error:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hesaplama Şablonları</h3>
        {currentCalculation && (
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Save className="mr-2 h-4 w-4" />
                Şablon Olarak Kaydet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Şablon Oluştur</DialogTitle>
                <DialogDescription>Bu hesaplamayı şablon olarak kaydedin</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Şablon Adı</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Örn: İstanbul-Rotterdam Standart Rota"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDesc">Açıklama</Label>
                  <Textarea
                    id="templateDesc"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Şablon açıklaması..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveTemplate} disabled={saving || !templateName} className="w-full">
                  {saving ? "Kaydediliyor..." : "Şablonu Kaydet"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Henüz şablon yok</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Gemi: {template.ship_name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
              <Button onClick={() => onLoadTemplate(template.id)} size="sm" variant="outline" className="w-full">
                Şablonu Kullan
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
