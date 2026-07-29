"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Ship, AlertCircle, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

const statusLabels: Record<string, string> = {
  todo: "Yapılacak",
  in_progress: "Devam Ediyor",
  review: "İnceleme",
  completed: "Tamamlandı",
  cancelled: "İptal",
}

const categoryLabels: Record<string, string> = {
  maintenance: "Bakım",
  inspection: "Denetim",
  documentation: "Dokümantasyon",
  compliance: "Uyumluluk",
  crew_management: "Mürettebat",
  certificate_renewal: "Sertifika",
  port_operations: "Liman İşlemleri",
  cargo_operations: "Kargo İşlemleri",
  safety: "Güvenlik",
  other: "Diğer",
}

interface TaskListProps {
  tasks: any[]
  onTaskUpdate: () => void
}

export function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-1 h-3 w-3 rounded-full flex-shrink-0",
                    priorityColors[task.priority as keyof typeof priorityColors],
                  )}
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{statusLabels[task.status]}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline">{categoryLabels[task.category]}</Badge>

                    {task.ship_name && (
                      <div className="flex items-center gap-1">
                        <Ship className="h-4 w-4" />
                        {task.ship_name}
                      </div>
                    )}

                    {task.due_date && (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          isOverdue(task.due_date) && task.status !== "completed" ? "text-red-600" : "",
                        )}
                      >
                        {isOverdue(task.due_date) && task.status !== "completed" ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                        {new Date(task.due_date).toLocaleDateString("tr-TR")}
                      </div>
                    )}

                    {task.assigned_to_name && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{task.assigned_to_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{task.assigned_to_name}</span>
                      </div>
                    )}

                    {task.comment_count > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {task.comment_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      {tasks.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Görev bulunamadı</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
