"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

export function BreadcrumbNav() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  // Don't show breadcrumbs on dashboard home
  if (segments.length <= 1) return null

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

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
