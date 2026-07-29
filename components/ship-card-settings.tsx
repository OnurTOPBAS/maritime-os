"use client"

import { useState, useEffect } from "react"
import { Settings2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export interface ShipCardSettings {
  showIMO: boolean
  showFlag: boolean
  showDWT: boolean
  showBuiltYear: boolean
  showVesselType: boolean
  showStatus: boolean
  viewMode: "compact" | "detailed"
}

const defaultSettings: ShipCardSettings = {
  showIMO: true,
  showFlag: true,
  showDWT: true,
  showBuiltYear: true,
  showVesselType: true,
  showStatus: true,
  viewMode: "detailed",
}

interface ShipCardSettingsProps {
  settings: ShipCardSettings
  onSettingsChange: (settings: ShipCardSettings) => void
}

export function ShipCardSettingsButton({ settings, onSettingsChange }: ShipCardSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Kart Ayarları
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Görünüm Modu</DropdownMenuLabel>
        <div className="px-2 py-2">
          <RadioGroup
            value={settings.viewMode}
            onValueChange={(value) => onSettingsChange({ ...settings, viewMode: value as "compact" | "detailed" })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="compact" />
              <Label htmlFor="compact" className="font-normal cursor-pointer">
                Kompakt
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="detailed" id="detailed" />
              <Label htmlFor="detailed" className="font-normal cursor-pointer">
                Detaylı
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Gösterilecek Bilgiler</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={settings.showIMO}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showIMO: checked })}
        >
          <Eye className="h-4 w-4 mr-2" />
          IMO Numarası
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.showFlag}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showFlag: checked })}
        >
          <Eye className="h-4 w-4 mr-2" />
          Bayrak
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.showDWT}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showDWT: checked })}
        >
          <Eye className="h-4 w-4 mr-2" />
          DWT
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.showBuiltYear}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showBuiltYear: checked })}
        >
          <Eye className="h-4 w-4 mr-2" />
          İnşa Yılı
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.showVesselType}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showVesselType: checked })}
        >
          <Eye className="h-4 w-4 mr-2" />
          Gemi Tipi
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.showStatus}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showStatus: checked })}
        >
          <Eye className="h-4 w-4 mr-2" />
          Durum
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function useShipCardSettings() {
  const [settings, setSettings] = useState<ShipCardSettings>(defaultSettings)

  useEffect(() => {
    const saved = localStorage.getItem("shipCardSettings")
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error("[v0] Failed to parse ship card settings:", error)
      }
    }
  }, [])

  const updateSettings = (newSettings: ShipCardSettings) => {
    setSettings(newSettings)
    localStorage.setItem("shipCardSettings", JSON.stringify(newSettings))
  }

  return { settings, updateSettings }
}
