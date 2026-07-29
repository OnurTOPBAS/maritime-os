import type React from "react"
import { cn } from "@/lib/utils"

interface DataLabelProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function DataLabel({ label, value, className }: DataLabelProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
