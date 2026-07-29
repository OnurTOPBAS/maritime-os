import type React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 pb-6 border-b border-border/50", className)}>
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl text-pretty">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
