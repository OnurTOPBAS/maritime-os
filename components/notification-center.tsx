"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, CheckCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("[v0] Error loading notifications:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setLoading(true)
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
      loadNotifications()
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      loadNotifications()
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬"
      case "mention":
        return "👤"
      case "certificate":
        return "📄"
      default:
        return "🔔"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Bildirimler</CardTitle>
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllAsRead} disabled={loading}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>
        <CardDescription>Son bildirimleriniz ve güncellemeler</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz bildiriminiz yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${notification.is_read ? "bg-background" : "bg-accent"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            disabled={loading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {notification.link && (
                        <Link href={notification.link}>
                          <Button size="sm" variant="link" className="px-0 mt-2">
                            Görüntüle →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
