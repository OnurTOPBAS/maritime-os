"use client"

import { useEffect, useState, useRef } from "react"
import {
  Bell,
  AlertCircle,
  Calendar,
  DollarSign,
  CheckCheck,
  MessageSquare,
  AtSign,
  CheckSquare,
  ListTodo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
  metadata?: any
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const retryCountRef = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Notifications API response:", data)

        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
          setUnreadCount(data.unreadCount || 0)
        } else if (Array.isArray(data)) {
          setNotifications(data)
          setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
        } else {
          console.error("[v0] Unexpected notifications data format:", data)
          setNotifications([])
          setUnreadCount(0)
        }
        retryCountRef.current = 0
      } else if (response.status === 429) {
        console.warn("[v0] Rate limited, will retry with backoff")
        handleRetryWithBackoff()
      }
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
      handleRetryWithBackoff()
    }
  }

  const handleRetryWithBackoff = () => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
      console.log(`[v0] Retrying in ${backoffDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`)
      setTimeout(fetchNotifications, backoffDelay)
    } else {
      console.warn("[v0] Max retries reached, will try again on next interval")
      retryCountRef.current = 0
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "mention":
        return <AtSign className="h-4 w-4" />
      case "task_assigned":
        return <CheckSquare className="h-4 w-4" />
      case "task_status_changed":
        return <ListTodo className="h-4 w-4" />
      case "task_comment":
        return <MessageSquare className="h-4 w-4" />
      case "laycan":
        return <Calendar className="h-4 w-4" />
      case "payment":
        return <DollarSign className="h-4 w-4" />
      case "voyage":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "message":
        return "text-blue-600"
      case "mention":
        return "text-purple-600"
      case "task_assigned":
        return "text-green-600"
      case "task_status_changed":
        return "text-orange-600"
      case "task_comment":
        return "text-blue-600"
      case "laycan":
        return "text-orange-600"
      case "payment":
        return "text-green-600"
      case "voyage":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base">Bildirimler</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} yeni
                </Badge>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={markAllAsRead}
                  title="Tümünü okundu işaretle"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Bildirim bulunmuyor</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2.5 rounded-md cursor-pointer hover:bg-accent transition-colors ${!notification.is_read ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${getTypeColor(notification.type)}`}>{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-sm"
                    onClick={() => {
                      setIsOpen(false)
                      router.push("/dashboard/notifications")
                    }}
                  >
                    Tüm Bildirimleri Görüntüle
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
