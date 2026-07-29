"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface TaskStatusBadgeProps {
  taskId: string
  currentStatus: string
}

export function TaskStatusBadge({ taskId, currentStatus }: TaskStatusBadgeProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const getStatusConfig = (s: string) => {
    switch (s) {
      case "todo":
        return { label: "Yapılacak", icon: Clock, variant: "secondary" as const }
      case "in_progress":
        return { label: "Devam Ediyor", icon: AlertCircle, variant: "default" as const }
      case "completed":
        return { label: "Tamamlandı", icon: CheckCircle2, variant: "outline" as const }
      default:
        return { label: s, icon: Clock, variant: "secondary" as const }
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status || isUpdating) return

    setIsUpdating(true)
    console.log("[v0] Changing status:", { taskId, from: status, to: newStatus })

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      console.log("[v0] Status change response:", { status: response.status, ok: response.ok })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const data = await response.json()
      console.log("[v0] Status updated:", data)

      setStatus(newStatus)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      alert("Durum güncellenirken bir hata oluştu")
    } finally {
      setIsUpdating(false)
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge variant={config.variant} className="cursor-pointer hover:opacity-80">
          {isUpdating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Icon className="mr-1 h-3 w-3" />}
          {config.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleStatusChange("todo")} disabled={isUpdating}>
          <Clock className="mr-2 h-4 w-4" />
          Yapılacak
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("in_progress")} disabled={isUpdating}>
          <AlertCircle className="mr-2 h-4 w-4" />
          Devam Ediyor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("completed")} disabled={isUpdating}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Tamamlandı
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
