"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

// URL parçalarının okunur Türkçe karşılıkları.
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Panel",
  companies: "Şirketler",
  invoices: "Faturalar",
  ships: "Gemiler",
  voyages: "Seferler",
  fleets: "Filolar",
  fixtures: "Fixtureler",
  certificates: "Sertifikalar",
  documents: "Belgeler",
  tasks: "Görevler",
  users: "Kullanıcılar",
  settings: "Ayarlar",
  reports: "Raporlar",
  finance: "Finans",
  "office-pnl": "Office PnL",
  banks: "Bankalar",
  ports: "Limanlar",
  messages: "Mesajlar",
  notifications: "Bildirimler",
}

// Bir sonraki parça bir kimlik (id) olduğunda gösterilecek "detay" etiketleri.
const DETAIL_LABELS: Record<string, string> = {
  companies: "Şirket Detayı",
  invoices: "Fatura Detayı",
  ships: "Gemi Detayı",
  voyages: "Sefer Detayı",
  fleets: "Filo Detayı",
  fixtures: "Fixture Detayı",
  certificates: "Sertifika Detayı",
  documents: "Belge Detayı",
  tasks: "Görev Detayı",
}

// UUID veya sayısal kimlik parçalarını tanır (breadcrumb'da ham id göstermemek için).
function isIdSegment(segment: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{16,}$/i.test(segment)
  )
}

function titleCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function BreadcrumbNav() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  // Don't show breadcrumbs on dashboard home
  if (segments.length <= 1) return null

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")

    let label: string
    if (isIdSegment(segment)) {
      // Ham id yerine bir üst parçaya göre okunur bir "detay" etiketi göster.
      const parent = segments[index - 1]
      label = (parent && DETAIL_LABELS[parent]) || "Detay"
    } else {
      label = SEGMENT_LABELS[segment] || titleCase(segment)
    }

    return { href, label }
  })

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          <ChevronRight className="h-4 w-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
