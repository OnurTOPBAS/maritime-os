"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Search, Ship, FileText, Anchor, Building2, Command, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

const quickActions = [
  { id: "new-ship", label: "Yeni Gemi", icon: Ship, href: "/dashboard/ships?action=new" },
  { id: "new-fixture", label: "Yeni Fixture", icon: Anchor, href: "/dashboard/fixtures?action=new" },
  { id: "new-invoice", label: "Yeni Fatura", icon: FileText, href: "/dashboard/invoices?action=new" },
  { id: "new-company", label: "Yeni Şirket", icon: Building2, href: "/dashboard?action=new-company" },
]

export function QuickActions() {
  const router = useRouter()
  const [fabOpen, setFabOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const savedVisibility = localStorage.getItem("quickActionsVisible")
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === "true")
    }
  }, [])

  const toggleVisibility = () => {
    const newVisibility = !isVisible
    setIsVisible(newVisibility)
    localStorage.setItem("quickActionsVisible", String(newVisibility))
    setFabOpen(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setCommandOpen(true)
      }
      // Ctrl/Cmd + N for new item menu
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        setFabOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredActions = quickActions.filter((action) =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleActionClick = (href: string) => {
    router.push(href)
    setFabOpen(false)
    setCommandOpen(false)
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isVisible ? (
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg bg-transparent"
            onClick={toggleVisibility}
            title="Hızlı İşlemleri Göster"
          >
            <Eye className="h-5 w-5" />
          </Button>
        ) : (
          <div className="relative">
            {fabOpen && (
              <div className="absolute bottom-16 right-0 bg-background border rounded-lg shadow-lg p-2 space-y-1 min-w-48">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action.href)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </button>
                  )
                })}
                <div className="border-t pt-1 mt-1">
                  <button
                    onClick={toggleVisibility}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors text-muted-foreground"
                  >
                    <EyeOff className="h-4 w-4" />
                    Gizle
                  </button>
                </div>
              </div>
            )}
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={() => setFabOpen(!fabOpen)}
              title="Hızlı İşlemler (Ctrl+N)"
            >
              <Plus className={cn("h-6 w-6 transition-transform", fabOpen && "rotate-45")} />
            </Button>
          </div>
        )}
      </div>

      {/* Command Palette */}
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Hızlı Arama
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Arama yapın veya komut seçin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto border-t">
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Hızlı İşlemler</div>
              {filteredActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.href)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{action.label}</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Enter</kbd>
                  </button>
                )
              })}
              {filteredActions.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">Sonuç bulunamadı</div>
              )}
            </div>
          </div>
          <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> Gezin
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd> Seç
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> Kapat
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl</kbd> +{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded">K</kbd>
            </span>
          </div>
        </DialogContent>
      </Dialog>

      {isVisible && (
        <div className="fixed bottom-6 left-6 z-40">
          <div className="bg-background/95 backdrop-blur border rounded-lg shadow-lg p-3 text-xs space-y-1">
            <div className="font-semibold mb-2">Klavye Kısayolları</div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+K</kbd>
              <span className="text-muted-foreground">Hızlı Arama</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+N</kbd>
              <span className="text-muted-foreground">Yeni Kayıt</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
