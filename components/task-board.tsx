"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Ship, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const statusColumns = [
  { id: "todo", label: "Yapılacak", color: "bg-slate-100" },
  { id: "in_progress", label: "Devam Ediyor", color: "bg-blue-100" },
  { id: "review", label: "İnceleme", color: "bg-yellow-100" },
  { id: "completed", label: "Tamamlandı", color: "bg-green-100" },
]

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
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

interface TaskBoardProps {
  tasks: any[]
  onTaskUpdate: () => void
}

export function TaskBoard({ tasks, onTaskUpdate }: TaskBoardProps) {
  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statusColumns.map((column) => {
        const columnTasks = getTasksByStatus(column.id)
        return (
          <Card key={column.id} className="flex flex-col">
            <CardHeader className={cn("pb-3", column.color)}>
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {column.label}
                <Badge variant="secondary" className="ml-2">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 pt-4">
              {columnTasks.map((task) => (
                <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                  <Card className="cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium leading-tight">{task.title}</h4>
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full flex-shrink-0",
                              priorityColors[task.priority as keyof typeof priorityColors],
                            )}
                          />
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[task.category]}
                          </Badge>
                          {task.ship_name && (
                            <Badge variant="outline" className="text-xs">
                              <Ship className="mr-1 h-3 w-3" />
                              {task.ship_name}
                            </Badge>
                          )}
                        </div>

                        {task.due_date && (
                          <div
                            className={cn(
                              "flex items-center gap-2 text-xs",
                              isOverdue(task.due_date) && task.status !== "completed"
                                ? "text-red-600"
                                : "text-muted-foreground",
                            )}
                          >
                            {isOverdue(task.due_date) && task.status !== "completed" ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                            {new Date(task.due_date).toLocaleDateString("tr-TR")}
                          </div>
                        )}

                        {task.assigned_to_name && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{task.assigned_to_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{task.assigned_to_name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {columnTasks.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Görev yok</p>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
