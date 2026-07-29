"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  AlertCircle,
  Calendar,
  DollarSign,
  MessageSquare,
  AtSign,
  CheckSquare,
  ListTodo,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
        } else if (Array.isArray(data)) {
          setNotifications(data)
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
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
    } catch (error) {
      console.error("Error marking notification as read:", error)
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
    } catch (error) {
      console.error("Error marking all as read:", error)
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
        return <MessageSquare className="h-5 w-5" />
      case "mention":
        return <AtSign className="h-5 w-5" />
      case "task_assigned":
        return <CheckSquare className="h-5 w-5" />
      case "task_status_changed":
        return <ListTodo className="h-5 w-5" />
      case "task_comment":
        return <MessageSquare className="h-5 w-5" />
      case "laycan":
        return <Calendar className="h-5 w-5" />
      case "payment":
        return <DollarSign className="h-5 w-5" />
      case "voyage":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "message":
        return "text-blue-600 bg-blue-50"
      case "mention":
        return "text-purple-600 bg-purple-50"
      case "task_assigned":
        return "text-green-600 bg-green-50"
      case "task_status_changed":
        return "text-orange-600 bg-orange-50"
      case "task_comment":
        return "text-blue-600 bg-blue-50"
      case "laycan":
        return "text-orange-600 bg-orange-50"
      case "payment":
        return "text-green-600 bg-green-50"
      case "voyage":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "message":
        return "Mesaj"
      case "mention":
        return "Bahsetme"
      case "task_assigned":
        return "Görev Atandı"
      case "task_status_changed":
        return "Görev Durumu"
      case "task_comment":
        return "Görev Yorumu"
      case "laycan":
        return "Laycan"
      case "payment":
        return "Ödeme"
      case "voyage":
        return "Sefer"
      default:
        return "Bildirim"
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read
    if (filter === "read") return n.is_read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bildirimler</h1>
          <p className="text-muted-foreground mt-1">Tüm bildirimlerinizi görüntüleyin ve yönetin</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bildirimler</CardTitle>
              <CardDescription>
                {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">Tümü ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Okunmamış ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Okunmuş ({notifications.length - unreadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-0">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "unread"
                      ? "Okunmamış bildirim bulunmuyor"
                      : filter === "read"
                        ? "Okunmuş bildirim bulunmuyor"
                        : "Bildirim bulunmuyor"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${!notification.is_read ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-base">{notification.title}</h3>
                            {!notification.is_read && (
                              <Badge variant="default" className="shrink-0">
                                Yeni
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge variant="outline" className="font-normal">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            <span>
                              {new Date(notification.created_at).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
