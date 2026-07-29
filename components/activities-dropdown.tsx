"use client"

import { useState, useEffect } from "react"
import { History, Ship, Anchor, FileText, Building2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

interface Activity {
  id: string
  action: string
  entity_type: string
  entity_id: string
  entity_name: string
  user_name: string
  created_at: string
}

export function ActivitiesDropdown() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const response = await fetch("/api/audit-logs?limit=5")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Activities loaded:", data)
        setActivities(data.logs || [])
      } else {
        console.log("[v0] Activities API returned error:", response.status)
      }
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (entityType: string) => {
    switch (entityType) {
      case "ship":
        return <Ship className="h-4 w-4" />
      case "fixture":
        return <Anchor className="h-4 w-4" />
      case "invoice":
        return <FileText className="h-4 w-4" />
      case "company":
        return <Building2 className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case "create":
        return "oluşturdu"
      case "update":
        return "güncelledi"
      case "delete":
        return "sildi"
      default:
        return action
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <History className="h-5 w-5" />
          {activities.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {activities.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Son Aktiviteler</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Henüz aktivite yok</div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <DropdownMenuItem key={activity.id} className="flex items-start gap-2 py-3 cursor-pointer">
                <div className="mt-0.5">{getIcon(activity.entity_type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user_name}</span>{" "}
                    <span className="text-muted-foreground">{getActionText(activity.action)}</span>
                  </p>
                  <p className="text-sm font-medium">{activity.entity_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-primary cursor-pointer"
          onClick={() => router.push("/dashboard/activity")}
        >
          Tüm aktiviteleri gör
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
