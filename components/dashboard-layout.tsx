import type React from "react"
import { DashboardHeader } from "./dashboard-header"
import { DashboardNav } from "./dashboard-nav"
import { QuickActions } from "./quick-actions"
import { BreadcrumbNav } from "./breadcrumb-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    name: string
    email: string
  }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      <DashboardNav />
      <main className="container mx-auto py-6">
        <BreadcrumbNav />
        {children}
      </main>
      <QuickActions />
    </div>
  )
}
