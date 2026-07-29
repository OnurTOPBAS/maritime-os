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

export interface FixtureCardSettings {
  showFixtureType: boolean
  showCargoType: boolean
  showRate: boolean
  showCpDate: boolean
  showLaycan: boolean
  showPorts: boolean
  viewMode: "compact" | "detailed"
}

const defaultSettings: FixtureCardSettings = {
  showFixtureType: true,
  showCargoType: true,
  showRate: true,
  showCpDate: true,
  showLaycan: true,
  showPorts: true,
  viewMode: "detailed",
}

interface FixtureCardSettingsProps {
  onSettingsChange: (settings: FixtureCardSettings) => void
}

export function FixtureCardSettingsComponent({ onSettingsChange }: FixtureCardSettingsProps) {
  const [settings, setSettings] = useState<FixtureCardSettings>(defaultSettings)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("fixtureCardSettings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
        onSettingsChange(parsed)
      } catch (e) {
        console.error("Failed to parse fixture card settings:", e)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<FixtureCardSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem("fixtureCardSettings", JSON.stringify(updated))
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
        <DropdownMenuLabel>Fixture Kart Ayarları</DropdownMenuLabel>
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
                <RadioGroupItem value="compact" id="compact-fixture" />
                <Label htmlFor="compact-fixture" className="font-normal cursor-pointer">
                  Kompakt
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed-fixture" />
                <Label htmlFor="detailed-fixture" className="font-normal cursor-pointer">
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
                <Label htmlFor="fixture-type" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showFixtureType ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Fixture Tipi
                </Label>
                <Switch
                  id="fixture-type"
                  checked={settings.showFixtureType}
                  onCheckedChange={(checked) => updateSettings({ showFixtureType: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="cargo-type" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showCargoType ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Kargo Tipi
                </Label>
                <Switch
                  id="cargo-type"
                  checked={settings.showCargoType}
                  onCheckedChange={(checked) => updateSettings({ showCargoType: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="rate" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showRate ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Navlun
                </Label>
                <Switch
                  id="rate"
                  checked={settings.showRate}
                  onCheckedChange={(checked) => updateSettings({ showRate: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="cp-date" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showCpDate ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  CP Tarihi
                </Label>
                <Switch
                  id="cp-date"
                  checked={settings.showCpDate}
                  onCheckedChange={(checked) => updateSettings({ showCpDate: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="laycan" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showLaycan ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Laycan
                </Label>
                <Switch
                  id="laycan"
                  checked={settings.showLaycan}
                  onCheckedChange={(checked) => updateSettings({ showLaycan: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ports" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  {settings.showPorts ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Limanlar
                </Label>
                <Switch
                  id="ports"
                  checked={settings.showPorts}
                  onCheckedChange={(checked) => updateSettings({ showPorts: checked })}
                />
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
