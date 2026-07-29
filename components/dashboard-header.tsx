"use client"

import { Anchor, LogOut, Menu, Settings, User, Search, Sun, Moon, Calendar, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardNav } from "@/components/dashboard-nav"
import { ActivitiesDropdown } from "@/components/activities-dropdown"
import { StatusIndicators } from "@/components/status-indicators"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GlobalSearch } from "@/components/global-search"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

interface DashboardHeaderProps {
  user: {
    name: string
    email: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const res = await fetch("/api/messages/unread-count")
        if (res.ok) {
          const data = await res.json()
          setUnreadMessages(data.count || 0)
        } else if (res.status === 401) {
          // User not authenticated, silently ignore
          setUnreadMessages(0)
        }
      } catch (error) {
        // Silently fail - user might not be authenticated or API might not be available
        setUnreadMessages(0)
      }
    }

    fetchUnreadMessages()
    const interval = setInterval(fetchUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  const getInitials = (name: string | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <header className="border-b bg-background shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="py-4">
                  <div className="px-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Anchor className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold">MaritimeOS</span>
                    </div>
                  </div>
                  <DashboardNav />
                </div>
              </SheetContent>
            </Sheet>

            <Anchor className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground hidden sm:inline">MaritimeOS</span>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground bg-transparent"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              Ara... <kbd className="ml-auto text-xs">Ctrl+K</kbd>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
              className="relative"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Tema değiştir</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/calendar")}
              title="Takvim"
              className="relative"
            >
              <Calendar className="h-5 w-5" />
              <span className="sr-only">Takvim</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/messages")}
              title="Mesajlar"
              className="relative"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
              <span className="sr-only">Mesajlar</span>
            </Button>

            <StatusIndicators />
            <ActivitiesDropdown />
            <NotificationsPanel />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Ayarlar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await fetch("/api/auth/signout", { method: "POST" })
                    router.push("/auth/signin")
                  }}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  )
}
