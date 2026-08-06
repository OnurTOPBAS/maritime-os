"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Calendar,
  User,
  Ship,
  MessageSquare,
  Activity,
  CheckCircle,
  Edit,
  Paperclip,
  X,
  Download,
} from "lucide-react"
import { format } from "date-fns"
import { TaskForm } from "@/components/task-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string

  const [task, setTask] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; size: number }>>([])
  const [watchers, setWatchers] = useState<any[]>([])

  useEffect(() => {
    loadTaskData()
    fetchCurrentUser()
  }, [taskId])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data.user?.id)
        setUser(data.user ?? null)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const loadTaskData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/tasks/${taskId}`)

      if (!res.ok) {
        console.error("Error loading task data:", await res.text())
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log("[v0] Task data loaded:", data)

      setTask(data.task)
      setComments(data.comments || [])
      setActivities(data.activity || [])
      setWatchers(data.watchers || [])
    } catch (error) {
      console.error("Error loading task data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    console.log("[v0] Status change requested:", { taskId, oldStatus: task?.status, newStatus })

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      console.log("[v0] Status update response:", { status: res.status, ok: res.ok })

      if (res.ok) {
        const data = await res.json()
        console.log("[v0] Status updated successfully:", data)
        loadTaskData()
      } else {
        const errorText = await res.text()
        console.error("[v0] Status update failed:", errorText)
      }
    } catch (error) {
      console.error("[v0] Error updating status:", error)
    }
  }

  const handleMarkAsComplete = async () => {
    console.log("[v0] Mark as complete clicked:", { taskId, currentStatus: task?.status })

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })

      console.log("[v0] Mark complete response:", { status: res.status, ok: res.ok })

      if (res.ok) {
        const data = await res.json()
        console.log("[v0] Task marked as complete:", data)
        loadTaskData()
      } else {
        const errorText = await res.text()
        console.error("[v0] Mark complete failed:", errorText)
      }
    } catch (error) {
      console.error("[v0] Error marking task as complete:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingFile(true)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/tasks/attachments", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("[v0] File upload failed:", errorText)
        alert("Dosya yüklenemedi. Lütfen tekrar deneyin.")
        return
      }

      const data = await res.json()
      setAttachments([...attachments, { url: data.url, name: data.name, size: data.size }])
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
      alert("Dosya yüklenirken bir hata oluştu.")
    } finally {
      setUploadingFile(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() && attachments.length === 0) return

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: newComment,
          attachments: attachments,
        }),
      })

      if (res.ok) {
        setNewComment("")
        setAttachments([])
        loadTaskData()
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in_progress":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusCardColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      case "in_progress":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      case "todo":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      case "cancelled":
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <DashboardLayout user={user ?? { name: "", email: "" }}>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!task) {
    return (
      <DashboardLayout user={user ?? { name: "", email: "" }}>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-muted-foreground">Görev bulunamadı</div>
          <Button onClick={() => router.push("/dashboard/tasks")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Görevlere Dön
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const isAssignedTo = currentUserId === task.assigned_to
  const isCreator = currentUserId === task.assigned_by
  const canComplete = isAssignedTo && task.status !== "completed"
  const canEdit = isCreator

  return (
    <DashboardLayout user={user ?? { name: "", email: "" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/dashboard/tasks")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Görevlere Dön
          </Button>
          <div className="flex gap-2">
            {canComplete && (
              <Button onClick={handleMarkAsComplete} variant="default">
                <CheckCircle className="mr-2 h-4 w-4" />
                Tamamlandı Olarak İşaretle
              </Button>
            )}
            {canEdit && (
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Görevi Düzenle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Görevi Düzenle</DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    task={task}
                    onSuccess={() => {
                      setEditDialogOpen(false)
                      loadTaskData()
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Yapılacak</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className={getStatusCardColor(task.status)}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  <Badge variant="outline">{task.category}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Açıklama</h3>
              <p className="text-muted-foreground">{task.description || "Açıklama yok"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Atanan</div>
                  <div className="font-medium">{task.assigned_to_name || "Atanmadı"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Oluşturan</div>
                  <div className="font-medium">{task.assigned_by_name}</div>
                </div>
              </div>

              {watchers.length > 0 && (
                <div className="col-span-2 flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-2">Ek Sorumlu Kişiler</div>
                    <div className="flex flex-wrap gap-2">
                      {watchers.map((watcher) => (
                        <Badge key={watcher.user_id} variant="secondary" className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">{watcher.user_name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          {watcher.user_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {task.ship_name && (
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Gemi</div>
                    <div className="font-medium">{task.ship_name}</div>
                  </div>
                </div>
              )}

              {task.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Bitiş Tarihi</div>
                    <div className="font-medium">{format(new Date(task.due_date), "dd MMM yyyy")}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Yorumlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Henüz yorum yok</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "dd MMM yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.comment}</p>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {comment.attachments.map((attachment: any, idx: number) => (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Yorum ekle..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm">
                        <Paperclip className="h-3 w-3" />
                        <span>{attachment.name}</span>
                        <button
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleAddComment} disabled={!newComment.trim() && attachments.length === 0}>
                    Yorum Ekle
                  </Button>
                  <Button variant="outline" disabled={uploadingFile} asChild>
                    <label className="cursor-pointer">
                      <Paperclip className="mr-2 h-4 w-4" />
                      {uploadingFile ? "Yükleniyor..." : "Dosya Ekle"}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Aktivite Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Henüz aktivite yok</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="border-l-2 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{activity.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), "dd MMM yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
