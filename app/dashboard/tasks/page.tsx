"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Database, CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TaskForm } from "@/components/task-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TaskStatusBadge } from "@/components/task-status-badge"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

export default function TasksPage() {
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [setupRequired, setSetupRequired] = useState(false)
  const [setupMessage, setSetupMessage] = useState("")
  const [settingUp, setSettingUp] = useState(false)

  useEffect(() => {
    loadUser()
    loadTasks()
  }, [])

  const loadUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error("[v0] Error loading user:", error)
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks`)
      const data = await response.json()
      console.log("[v0] Tasks loaded:", data)

      if (data.setupRequired) {
        setSetupRequired(true)
        setSetupMessage(data.message || "Database setup required")
        setTasks([])
      } else {
        setSetupRequired(false)
        setTasks(Array.isArray(data.tasks) ? data.tasks : [])
      }
    } catch (error) {
      console.error("[v0] Error loading tasks:", error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    try {
      setSettingUp(true)
      const response = await fetch("/api/tasks/setup", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        setSetupRequired(false)
        await loadTasks()
      } else {
        alert("Kurulum başarısız: " + (data.details || data.error))
      }
    } catch (error) {
      console.error("[v0] Error setting up tasks:", error)
      alert("Kurulum sırasında bir hata oluştu")
    } finally {
      setSettingUp(false)
    }
  }

  const handleTaskCreated = () => {
    setShowCreateDialog(false)
    loadTasks()
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }

  const filteredTasks = tasks
    .filter((task) => {
      if (activeTab === "all") return true
      if (activeTab === "my-tasks") return task.assigned_to === user?.id
      return task.status === activeTab
    })
    .filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Acil"
      case "high":
        return "Yüksek"
      case "medium":
        return "Orta"
      case "low":
        return "Düşük"
      default:
        return priority
    }
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-l-4 border-l-green-500"
      case "in_progress":
        return "border-l-4 border-l-blue-500"
      case "todo":
        return "border-l-4 border-l-yellow-500"
      case "cancelled":
        return "border-l-4 border-l-gray-400"
      default:
        return "border-l-4 border-l-gray-300"
    }
  }

  const getStatusCardColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 dark:bg-green-950"
      case "in_progress":
        return "bg-blue-50 dark:bg-blue-950"
      case "todo":
        return "bg-yellow-50 dark:bg-yellow-950"
      default:
        return ""
    }
  }

  if (setupRequired) {
    return (
      <DashboardLayout user={user || { name: "", email: "" }}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Görev Yönetimi</h1>
            <p className="text-muted-foreground">Takım görevlerini oluşturun, atayın ve takip edin</p>
          </div>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Veritabanı Kurulumu Gerekli</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>Görev yönetimi özelliğini kullanabilmek için veritabanı tablolarının oluşturulması gerekiyor.</p>
              <Button onClick={handleSetup} disabled={settingUp} size="lg">
                {settingUp ? "Kuruluyor..." : "Görev Yönetimini Kur"}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user || { name: "", email: "" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Görev Yönetimi</h1>
            <p className="text-muted-foreground">Takım görevlerini oluşturun, atayın ve takip edin</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Görev
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className={getStatusCardColor("todo")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yapılacak</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{stats.todo}</div>
            </CardContent>
          </Card>
          <Card className={getStatusCardColor("in_progress")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devam Ediyor</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className={getStatusCardColor("completed")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlandı</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Görev ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="my-tasks">Görevlerim</TabsTrigger>
            <TabsTrigger value="todo">Yapılacak</TabsTrigger>
            <TabsTrigger value="in_progress">Devam Ediyor</TabsTrigger>
            <TabsTrigger value="completed">Tamamlandı</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Görevler yükleniyor...</p>
                </CardContent>
              </Card>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ListTodo className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">Görev bulunamadı</p>
                  <p className="text-sm text-muted-foreground">Yeni bir görev oluşturarak başlayın</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={`hover:shadow-md transition-shadow ${getStatusBorderColor(task.status)}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/dashboard/tasks/${task.id}`} className="flex-1">
                          <CardTitle className="text-lg hover:underline">{task.title}</CardTitle>
                        </Link>
                        <TaskStatusBadge taskId={task.id} currentStatus={task.status} />
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority) as any}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        {task.ship_name && (
                          <Badge variant="outline" className="text-xs">
                            {task.ship_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {task.assigned_to_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{task.assigned_to_name}</span>
                          {task.watcher_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{task.watcher_count}
                            </Badge>
                          )}
                        </div>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.due_date).toLocaleDateString("tr-TR")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Yeni Görev Oluştur</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <TaskForm onSuccess={handleTaskCreated} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
