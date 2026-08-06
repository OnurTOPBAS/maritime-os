"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, TrendingUp, Users, Clock, Download, Calendar, BarChart3, FileEdit, Plus, Trash2 } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart as RePieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ActivityStats {
  activityByAction: Array<{ action: string; count: number }>
  activityByEntity: Array<{ entity_type: string; count: number }>
  dailyActivity: Array<{ date: string; count: number }>
  mostActiveUsers: Array<{
    id: string
    name: string
    email: string
    profile_photo_url?: string
    activity_count: number
    last_activity: string
  }>
  recentActivities: Array<{
    id: string
    action: string
    entity_type: string
    created_at: string
    user_name: string
    user_email: string
    profile_photo_url?: string
  }>
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function UserActivityDashboard() {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")
  const [selectedUser, setSelectedUser] = useState<string>("all")

  useEffect(() => {
    fetchStats()
  }, [timeRange, selectedUser])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ days: timeRange })
      if (selectedUser !== "all") {
        params.append("userId", selectedUser)
      }

      const response = await fetch(`/api/users/activity-stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch activity stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    // TODO: Implement Excel export
    alert("Excel export özelliği yakında eklenecek")
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="h-4 w-4" />
      case "update":
        return <FileEdit className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActionText = (action: string) => {
    const texts: Record<string, string> = {
      create: "Oluşturma",
      update: "Güncelleme",
      delete: "Silme",
    }
    return texts[action] || action
  }

  const getEntityText = (type: string) => {
    const types: Record<string, string> = {
      company: "Şirket",
      fleet: "Filo",
      ship: "Gemi",
      fixture: "Fixture",
      voyage: "Sefer",
      invoice: "Fatura",
      document: "Doküman",
      certificate: "Sertifika",
    }
    return types[type] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalActivities = stats?.activityByAction.reduce((sum, item) => sum + Number(item.count), 0) || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Kullanıcı Aktivite Dashboard</h2>
          <p className="text-muted-foreground">Kullanıcı aktivitelerini ve istatistiklerini görüntüleyin</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Son 7 Gün</SelectItem>
              <SelectItem value="30">Son 30 Gün</SelectItem>
              <SelectItem value="90">Son 90 Gün</SelectItem>
              <SelectItem value="365">Son 1 Yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Excel'e Aktar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Aktivite</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
            <p className="text-xs text-muted-foreground">Son {timeRange} günde</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.mostActiveUsers.length || 0}</div>
            <p className="text-xs text-muted-foreground">Aktivite kaydı olan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Günlük Ortalama</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.dailyActivity.length ? Math.round(totalActivities / stats.dailyActivity.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Aktivite/gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Aktif Modül</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activityByEntity[0] ? getEntityText(stats.activityByEntity[0].entity_type) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.activityByEntity[0] ? `${stats.activityByEntity[0].count} aktivite` : "Veri yok"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activity by Action */}
            <Card>
              <CardHeader>
                <CardTitle>İşlem Türüne Göre Aktivite</CardTitle>
                <CardDescription>Oluşturma, güncelleme ve silme işlemleri</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Aktivite Sayısı",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={stats?.activityByAction.map((item) => ({
                          name: getActionText(item.action),
                          value: Number(item.count),
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats?.activityByAction.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RePieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Activity by Entity */}
            <Card>
              <CardHeader>
                <CardTitle>Modül Bazında Aktivite</CardTitle>
                <CardDescription>Hangi modüller daha çok kullanılıyor</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Aktivite Sayısı",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats?.activityByEntity.map((item) => ({
                        name: getEntityText(item.entity_type),
                        count: Number(item.count),
                      }))}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Günlük Aktivite Trendi</CardTitle>
              <CardDescription>Zaman içinde aktivite değişimi</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Aktivite",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.dailyActivity
                      .slice()
                      .reverse()
                      .map((item) => ({
                        date: new Date(item.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
                        count: Number(item.count),
                      }))}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En Aktif Kullanıcılar</CardTitle>
              <CardDescription>Son {timeRange} günde en çok aktivite gösteren kullanıcılar</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {stats?.mostActiveUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl font-bold text-muted-foreground w-8">#{index + 1}</div>
                        <Avatar>
                          <AvatarImage src={user.profile_photo_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{user.activity_count}</div>
                        <div className="text-xs text-muted-foreground">aktivite</div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {formatDate(user.last_activity)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
              <CardDescription>Gerçek zamanlı aktivite akışı</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {stats?.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.profile_photo_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {activity.user_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{activity.user_name}</span>
                          <Badge variant="outline">{getEntityText(activity.entity_type)}</Badge>
                          <span className="text-sm text-muted-foreground">{getActionText(activity.action)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(activity.created_at)}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted">{getActionIcon(activity.action)}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
