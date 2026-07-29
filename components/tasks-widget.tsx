"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Clock, AlertCircle, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string
  assigned_to_name: string
  ship_name: string
}

export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({ todo: 0, in_progress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks")
        if (res.ok) {
          const data = await res.json()
          const taskList = data.tasks || []
          setTasks(taskList.slice(0, 5)) // Show only 5 most recent tasks

          // Calculate stats
          const todo = taskList.filter((t: Task) => t.status === "todo").length
          const inProgress = taskList.filter((t: Task) => t.status === "in_progress").length
          const completed = taskList.filter((t: Task) => t.status === "completed").length
          setStats({ todo, in_progress: inProgress, completed })
        }
      } catch (error) {
        console.error("[v0] Error loading tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "todo":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlandı"
      case "in_progress":
        return "Devam Ediyor"
      case "todo":
        return "Yapılacak"
      default:
        return status
    }
  }

  const getPriorityText = (priority: string) => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Görevler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Görevler</CardTitle>
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Görev
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{stats.todo}</div>
            <div className="text-xs text-orange-700">Yapılacak</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            <div className="text-xs text-blue-700">Devam Ediyor</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-green-700">Tamamlandı</div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Henüz görev bulunmuyor</p>
              <Link href="/dashboard/tasks">
                <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                  İlk Görevi Oluştur
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {tasks.map((task) => (
                <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                  <div className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getStatusIcon(task.status)}
                        <span className="font-medium text-sm truncate">{task.title}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getStatusText(task.status)}</span>
                      {task.due_date && (
                        <span>
                          {new Date(task.due_date).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/dashboard/tasks">
                <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  Tüm Görevler
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
