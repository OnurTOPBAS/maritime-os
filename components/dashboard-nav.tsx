"use client"

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

const navItems = [
  {
    title: "Ana Sayfa",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Filolar",
    icon: Layers,
    items: [
      {
        title: "Filolar",
        href: "/dashboard/companies",
        icon: Layers,
        description: "Tüm filoları görüntüle",
      },
      {
        title: "Gemiler",
        href: "/dashboard/ships",
        icon: Ship,
        description: "Tüm gemileri görüntüle",
      },
    ],
  },
  {
    title: "Operasyonlar",
    icon: Ship,
    items: [
      {
        title: "Fixture'lar",
        href: "/dashboard/fixtures",
        icon: FileCheck,
        description: "Fixture yönetimi",
      },
      {
        title: "Seferler",
        href: "/dashboard/voyages",
        icon: Anchor,
        description: "Sefer takibi",
      },
      {
        title: "Sefer Hesaplama",
        href: "/dashboard/voyage-calculator",
        icon: Calculator,
        description: "Sefer maliyeti hesapla",
      },
    ],
  },
  {
    title: "Finans",
    icon: FileText,
    items: [
      {
        title: "Faturalar",
        href: "/dashboard/invoices",
        icon: FileText,
        description: "Fatura yönetimi",
      },
      {
        title: "Office PnL",
        href: "/dashboard/finance/office-pnl",
        icon: Wallet,
        description: "Ofis gelir/gider yönetimi",
      },
      {
        title: "Raporlar",
        href: "/dashboard/reports",
        icon: BarChart3,
        description: "Finansal raporlar",
      },
      {
        title: "Sertifikalar",
        href: "/dashboard/certificates/reports",
        icon: BarChart3,
        description: "Sertifika raporları",
      },
    ],
  },
  {
    title: "Yönetim",
    icon: Settings,
    items: [
      {
        title: "Görevler",
        href: "/dashboard/tasks",
        icon: CheckSquare,
        description: "Görev yönetimi",
      },
      {
        title: "Mesajlar",
        href: "/dashboard/messages",
        icon: MessageSquare,
        description: "İletişim merkezi",
      },
      {
        title: "Kullanıcılar",
        href: "/dashboard/users",
        icon: Users,
        description: "Kullanıcı yönetimi",
      },
      {
        title: "Şirketler",
        href: "/dashboard/companies",
        icon: Building2,
        description: "Şirket yönetimi",
      },
      {
        title: "Kullanıcı Aktivitesi",
        href: "/dashboard/users/activity",
        icon: History,
        description: "Aktivite geçmişi",
      },
      {
        title: "Ayarlar",
        href: "/dashboard/settings",
        icon: Settings,
        description: "Sistem ayarları",
      },
      {
        title: "Site Haritası",
        href: "/dashboard/sitemap",
        icon: Map,
        description: "Tüm sayfalar",
      },
    ],
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block sticky top-16 z-40">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-1 md:overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon

            if (item.items) {
              const isActive = item.items.some((subItem) => pathname === subItem.href)

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
                    {item.items.map((subItem) => {
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
