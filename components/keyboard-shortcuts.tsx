"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, Search, Ship, Anchor, Route, FileText, BarChart3 } from "lucide-react"
import { GlobalSearch } from "@/components/global-search"

const shortcuts = [
  { key: "Ctrl+K", description: "Hızlı arama", icon: Search },
  { key: "Ctrl+N", description: "Yeni kayıt", icon: Command },
  { key: "G then S", description: "Gemiler sayfası", icon: Ship },
  { key: "G then F", description: "Fixture'lar sayfası", icon: Anchor },
  { key: "G then V", description: "Seferler sayfası", icon: Route },
  { key: "G then I", description: "Faturalar sayfası", icon: FileText },
  { key: "G then R", description: "Raporlar sayfası", icon: BarChart3 },
  { key: "?", description: "Kısayolları göster", icon: Command },
]

export function KeyboardShortcuts() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [gPressed, setGPressed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }

      // ? for help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault()
          setHelpOpen(true)
        }
      }

      // G then X navigation
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setGPressed(true)
          setTimeout(() => setGPressed(false), 1000)
        }
      }

      if (gPressed) {
        switch (e.key) {
          case "s":
            router.push("/dashboard/ships")
            setGPressed(false)
            break
          case "f":
            router.push("/dashboard/fixtures")
            setGPressed(false)
            break
          case "v":
            router.push("/dashboard/voyages")
            setGPressed(false)
            break
          case "i":
            router.push("/dashboard/invoices")
            setGPressed(false)
            break
          case "r":
            router.push("/dashboard/reports")
            setGPressed(false)
            break
        }
      }

      // Escape to close dialogs
      if (e.key === "Escape") {
        setSearchOpen(false)
        setHelpOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gPressed, router])

  return (
    <>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Klavye Kısayolları</DialogTitle>
            <DialogDescription>Daha hızlı çalışmak için klavye kısayollarını kullanın</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{shortcut.description}</span>
                </div>
                <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
