import type React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataLabelProps {
  label: string
  value: React.ReactNode
  /** Etiketin yanında gösterilecek simge (isteğe bağlı). */
  icon?: LucideIcon
  className?: string
}

export function DataLabel({ label, value, icon: Icon, className }: DataLabelProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
