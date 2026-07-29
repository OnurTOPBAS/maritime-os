"use client"

import { useState, useEffect } from "react"
import { Ship, Anchor, FileText, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DashboardCounts {
  totalShips: number
  activeVoyages: number
  pendingInvoices: number
}

export function StatusIndicators() {
  const [counts, setCounts] = useState<DashboardCounts>({
    totalShips: 0,
    activeVoyages: 0,
    pendingInvoices: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCounts()
  }, [])

  const loadCounts = async () => {
    try {
      const response = await fetch("/api/dashboard/counts")
      if (response.ok) {
        const data = await response.json()
        setCounts(data)
      }
    } catch (error) {
      console.error("Error loading counts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="hidden lg:flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Ship className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary" className="font-normal">
          {counts.totalShips}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <Anchor className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary" className="font-normal">
          {counts.activeVoyages}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary" className="font-normal">
          {counts.pendingInvoices}
        </Badge>
      </div>
    </div>
  )
}
