"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Ship,
  FileText,
  BarChart3,
  Home,
  History,
  Settings,
  Users,
  Anchor,
  FileCheck,
  ChevronDown,
  Calculator,
  Map,
  MessageSquare,
  Layers,
  CheckSquare,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Her öğeye erişim için gereken modül (module.view). module yoksa herkese açık.
// superAdminOnly: yalnızca süper yönetici görür.
const navItems: any[] = [
  {
    title: "Ana Sayfa",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Filolar",
    icon: Layers,
    items: [
      { title: "Filolar", href: "/dashboard/companies", icon: Layers, description: "Tüm filoları görüntüle", module: "companies" },
      { title: "Gemiler", href: "/dashboard/ships", icon: Ship, description: "Tüm gemileri görüntüle", module: "ships" },
    ],
  },
  {
    title: "Operasyonlar",
    icon: Ship,
    items: [
      { title: "Fixture'lar", href: "/dashboard/fixtures", icon: FileCheck, description: "Fixture yönetimi", module: "fixtures" },
      { title: "Seferler", href: "/dashboard/voyages", icon: Anchor, description: "Sefer takibi", module: "voyages" },
      { title: "Sefer Hesaplama", href: "/dashboard/voyage-calculator", icon: Calculator, description: "Sefer maliyeti hesapla", module: "voyage_calculator" },
    ],
  },
  {
    title: "Finans",
    icon: FileText,
    items: [
      { title: "Faturalar", href: "/dashboard/invoices", icon: FileText, description: "Fatura yönetimi", module: "invoices" },
      { title: "Office PnL", href: "/dashboard/finance/office-pnl", icon: Wallet, description: "Ofis gelir/gider yönetimi", module: "finance" },
      { title: "Raporlar", href: "/dashboard/reports", icon: BarChart3, description: "Finansal raporlar", module: "reports" },
      { title: "Sertifikalar", href: "/dashboard/certificates/reports", icon: BarChart3, description: "Sertifika raporları", module: "certificates" },
    ],
  },
  {
    title: "Yönetim",
    icon: Settings,
    items: [
      { title: "Görevler", href: "/dashboard/tasks", icon: CheckSquare, description: "Görev yönetimi", module: "tasks" },
      { title: "Mesajlar", href: "/dashboard/messages", icon: MessageSquare, description: "İletişim merkezi", module: "messages" },
      { title: "Kullanıcılar", href: "/dashboard/users", icon: Users, description: "Kullanıcı yönetimi", module: "users" },
      { title: "Şirketler", href: "/dashboard/companies", icon: Building2, description: "Şirket yönetimi", module: "companies" },
      { title: "Kullanıcı Aktivitesi", href: "/dashboard/users/activity", icon: History, description: "Aktivite geçmişi", superAdminOnly: true },
      { title: "Ayarlar", href: "/dashboard/settings", icon: Settings, description: "Sistem ayarları" },
      { title: "Site Haritası", href: "/dashboard/sitemap", icon: Map, description: "Tüm sayfalar" },
    ],
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const [access, setAccess] = useState<{ superAdmin: boolean; actions: Set<string> } | null>(null)

  useEffect(() => {
    fetch("/api/auth/my-modules")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setAccess({ superAdmin: !!d.superAdmin, actions: new Set<string>(d.actions || []) })
      })
      .catch(() => {})
  }, [])

  // Bir öğe görünür mü? (yetkiler yüklenene kadar her şey gizli değil — layout
  // kaymasın diye; ama gizlenmesi gerekenler yüklenince gizlenir.)
  const canSee = (item: any): boolean => {
    if (!access) return true // yükleniyor
    if (item.superAdminOnly) return access.superAdmin
    if (!item.module) return true // modülsüz (Ana Sayfa, Ayarlar, Site Haritası)
    if (access.superAdmin || access.actions.has("*")) return true
    return access.actions.has(`*.view`) || access.actions.has(`${item.module}.view`)
  }

  // Görünür menüyü hesapla: alt öğeleri süz, hiç alt öğesi kalmayan grubu at.
  const visibleNav = navItems
    .map((top) => {
      if (!top.items) return canSee(top) ? top : null
      const items = top.items.filter(canSee)
      return items.length > 0 ? { ...top, items } : null
    })
    .filter(Boolean) as any[]

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block sticky top-16 z-40">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-1 md:overflow-x-auto scrollbar-hide">
          {visibleNav.map((item) => {
            const Icon = item.icon

            if (item.items) {
              const isActive = item.items.some((subItem: any) => pathname === subItem.href)

              return (
                <DropdownMenu key={item.title}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:text-primary hover:bg-accent/50 md:border-b-2 whitespace-nowrap h-auto rounded-none group",
                        isActive
                          ? "md:border-primary text-primary bg-accent/50 md:bg-transparent"
                          : "md:border-transparent text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                      {item.title}
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 p-2">
                    {item.items.map((subItem: any) => {
                      const SubIcon = subItem.icon
                      const isSubActive = pathname === subItem.href

                      return (
                        <DropdownMenuItem key={subItem.href} asChild className="p-0">
                          <Link
                            href={subItem.href}
                            className={cn(
                              "flex flex-col items-start gap-1 cursor-pointer p-3 rounded-md transition-colors",
                              isSubActive && "bg-accent text-primary font-medium",
                            )}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <SubIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium">{subItem.title}</span>
                            </div>
                            {subItem.description && (
                              <span className="text-xs text-muted-foreground ml-6">{subItem.description}</span>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:text-primary hover:bg-accent/50 md:border-b-2 whitespace-nowrap group",
                  isActive
                    ? "md:border-primary text-primary bg-accent/50 md:bg-transparent"
                    : "md:border-transparent text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
