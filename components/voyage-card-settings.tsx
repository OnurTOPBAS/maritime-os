"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings2, Eye, EyeOff } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export interface VoyageCardSettings {
  showLoadingPorts: boolean
  showDischargePorts: boolean
  showStartDate: boolean
  showEndDate: boolean
  showCharterer: boolean
  showStatus: boolean
  viewMode: "compact" | "detailed"
}

const defaultSettings: VoyageCardSettings = {
  showLoadingPorts: true,
  showDischargePorts: true,
  showStartDate: true,
  showEndDate: true,
  showCharterer: true,
  showStatus: true,
  viewMode: "detailed",
}

interface VoyageCardSettingsProps {
  onSettingsChange: (settings: VoyageCardSettings) => void
}

export function VoyageCardSettingsComponent({ onSettingsChange }: VoyageCardSettingsProps) {
  const [settings, setSettings] = useState<VoyageCardSettings>(defaultSettings)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("voyageCardSettings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
        onSettingsChange(parsed)
      } catch (e) {
        console.error("Failed to parse voyage card settings:", e)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<VoyageCardSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem("voyageCardSettings", JSON.stringify(updated))
    onSettingsChange(updated)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Settings2 className="h-4 w-4" />
          Kart Ayarları
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Sefer Kart Ayarları</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-3 block">Görünüm Modu</Label>
            <RadioGroup
              value={settings.viewMode}
              onValueChange={(value) => updateSettings({ viewMode: value as "compact" | "detailed" })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="compact-voyage" />
                <Label htmlFor="compact-voyage" className="font-normal cursor-pointer">
                  Kompakt
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed-voyage" />
                <Label htmlFor="detailed-voyage" className="font-normal cursor-pointer">
                  Detaylı
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DropdownMenuSeparator />

          <div>
            <Label className="text-sm font-semibold mb-3 block">Gösterilecek Alanlar</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="loading-ports" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showLoadingPorts ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Yükleme Limanları
                </Label>
                <Switch
                  id="loading-ports"
                  checked={settings.showLoadingPorts}
                  onCheckedChange={(checked) => updateSettings({ showLoadingPorts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="discharge-ports" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showDischargePorts ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Tahliye Limanları
                </Label>
                <Switch
                  id="discharge-ports"
                  checked={settings.showDischargePorts}
                  onCheckedChange={(checked) => updateSettings({ showDischargePorts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="start-date" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showStartDate ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Başlangıç Tarihi
                </Label>
                <Switch
                  id="start-date"
                  checked={settings.showStartDate}
                  onCheckedChange={(checked) => updateSettings({ showStartDate: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="end-date" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showEndDate ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Bitiş Tarihi
                </Label>
                <Switch
                  id="end-date"
                  checked={settings.showEndDate}
                  onCheckedChange={(checked) => updateSettings({ showEndDate: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="charterer" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showCharterer ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Charterer
                </Label>
                <Switch
                  id="charterer"
                  checked={settings.showCharterer}
                  onCheckedChange={(checked) => updateSettings({ showCharterer: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="status" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showStatus ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Durum
                </Label>
                <Switch
                  id="status"
                  checked={settings.showStatus}
                  onCheckedChange={(checked) => updateSettings({ showStatus: checked })}
                />
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
