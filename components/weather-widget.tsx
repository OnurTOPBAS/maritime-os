"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, Wind, Waves, Thermometer, Settings, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface WeatherData {
  id: string
  location: string
  temperature: number
  windSpeed: number
  waveHeight: number
  seaState: string
  condition: string
}

const ALL_LOCATIONS: WeatherData[] = [
  {
    id: "mediterranean",
    location: "Akdeniz",
    temperature: 24,
    windSpeed: 15,
    waveHeight: 1.5,
    seaState: "Hafif Dalgalı",
    condition: "Açık",
  },
  {
    id: "black-sea",
    location: "Karadeniz",
    temperature: 18,
    windSpeed: 22,
    waveHeight: 2.8,
    seaState: "Dalgalı",
    condition: "Bulutlu",
  },
  {
    id: "aegean",
    location: "Ege Denizi",
    temperature: 22,
    windSpeed: 12,
    waveHeight: 1.2,
    seaState: "Sakin",
    condition: "Açık",
  },
  {
    id: "marmara",
    location: "Marmara Denizi",
    temperature: 20,
    windSpeed: 18,
    waveHeight: 1.8,
    seaState: "Hafif Dalgalı",
    condition: "Parçalı Bulutlu",
  },
  {
    id: "north-atlantic",
    location: "Kuzey Atlantik",
    temperature: 12,
    windSpeed: 28,
    waveHeight: 3.5,
    seaState: "Çok Dalgalı",
    condition: "Yağmurlu",
  },
  {
    id: "persian-gulf",
    location: "Basra Körfezi",
    temperature: 32,
    windSpeed: 10,
    waveHeight: 0.8,
    seaState: "Sakin",
    condition: "Açık",
  },
  {
    id: "red-sea",
    location: "Kızıldeniz",
    temperature: 28,
    windSpeed: 14,
    waveHeight: 1.3,
    seaState: "Hafif Dalgalı",
    condition: "Açık",
  },
]

interface WeatherPreferences {
  selectedLocations: string[]
  customLocations: Array<{ name: string; enabled: boolean }>
}

export function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [preferences, setPreferences] = useState<WeatherPreferences>({
    selectedLocations: ["mediterranean", "black-sea", "aegean"],
    customLocations: [],
  })
  const [newLocationName, setNewLocationName] = useState("")

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/widget-preferences?widgetId=weather")
        if (response.ok) {
          const data = await response.json()
          if (data.preferences && data.preferences.selectedLocations) {
            setPreferences(data.preferences)
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
      }
    }
    loadPreferences()
  }, [])

  useEffect(() => {
    const selectedData = ALL_LOCATIONS.filter((loc) => preferences.selectedLocations.includes(loc.id))
    setTimeout(() => {
      setWeatherData(selectedData)
      setLoading(false)
    }, 500)
  }, [preferences])

  const handleSavePreferences = async () => {
    try {
      await fetch("/api/widget-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: "weather",
          preferences,
        }),
      })
      setSettingsOpen(false)
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  const handleToggleLocation = (locationId: string) => {
    setPreferences((prev) => ({
      ...prev,
      selectedLocations: prev.selectedLocations.includes(locationId)
        ? prev.selectedLocations.filter((id) => id !== locationId)
        : [...prev.selectedLocations, locationId],
    }))
  }

  const handleAddCustomLocation = () => {
    if (newLocationName.trim()) {
      setPreferences((prev) => ({
        ...prev,
        customLocations: [...prev.customLocations, { name: newLocationName.trim(), enabled: true }],
      }))
      setNewLocationName("")
    }
  }

  const handleRemoveCustomLocation = (index: number) => {
    setPreferences((prev) => ({
      ...prev,
      customLocations: prev.customLocations.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <Card className="border-l-4 border-l-cyan-500">
        <CardHeader>
          <CardTitle className="text-lg">Hava Durumu</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-cyan-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Hava Durumu</CardTitle>
            <CardDescription>Gemi bölgelerindeki hava ve deniz durumu</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Hava Durumu Ayarları</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Hava durumunu takip etmek istediğiniz bölgeleri seçin veya özel lokasyon ekleyin.
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Hazır Bölgeler</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {ALL_LOCATIONS.map((location) => (
                        <div key={location.id} className="flex items-center space-x-2 p-2 border rounded">
                          <Checkbox
                            id={location.id}
                            checked={preferences.selectedLocations.includes(location.id)}
                            onCheckedChange={() => handleToggleLocation(location.id)}
                          />
                          <Label htmlFor={location.id} className="cursor-pointer flex-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {location.location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Özel Lokasyonlar</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Lokasyon adı (örn: İstanbul Limanı)"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomLocation()}
                      />
                      <Button onClick={handleAddCustomLocation}>Ekle</Button>
                    </div>
                    {preferences.customLocations.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {preferences.customLocations.map((loc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{loc.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveCustomLocation(index)}>
                              Kaldır
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Not: Özel lokasyonlar için hava durumu verileri henüz desteklenmemektedir.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleSavePreferences}>Kaydet</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Cloud className="h-8 w-8 text-cyan-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {weatherData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ayarlardan görmek istediğiniz bölgeleri seçin
          </p>
        ) : (
          weatherData.map((data, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-700 dark:text-cyan-400">{data.location}</span>
                <span className="text-sm text-muted-foreground">{data.condition}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <span>{data.temperature}°C</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-4 w-4 text-blue-500" />
                  <span>{data.windSpeed} kt</span>
                </div>
                <div className="flex items-center gap-1">
                  <Waves className="h-4 w-4 text-cyan-500" />
                  <span>{data.waveHeight}m</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Deniz Durumu: {data.seaState}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
