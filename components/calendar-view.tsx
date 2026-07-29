"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Ship, Anchor } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: "laycan" | "voyage" | "fixture"
  status?: string
  details?: any
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ]

  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "laycan":
        return "bg-blue-500"
      case "voyage":
        return "bg-green-500"
      case "fixture":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 border border-border/50" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day)
    const isToday =
      day === new Date().getDate() &&
      currentDate.getMonth() === new Date().getMonth() &&
      currentDate.getFullYear() === new Date().getFullYear()

    days.push(
      <div
        key={day}
        className={cn(
          "h-24 border border-border/50 p-2 overflow-y-auto hover:bg-muted/50 transition-colors",
          isToday && "bg-primary/5 border-primary",
        )}
      >
        <div className={cn("text-sm font-semibold mb-1", isToday && "text-primary")}>{day}</div>
        <div className="space-y-1">
          {dayEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className={cn(
                "w-full text-left text-xs p-1 rounded text-white truncate flex items-center gap-1",
                getEventColor(event.type),
              )}
            >
              {event.type === "voyage" ? (
                <Ship className="h-3 w-3 flex-shrink-0" />
              ) : (
                <Anchor className="h-3 w-3 flex-shrink-0" />
              )}
              <span className="truncate">{event.title}</span>
            </button>
          ))}
        </div>
      </div>,
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Bugün
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0">
          {dayNames.map((day) => (
            <div key={day} className="text-center font-semibold text-sm p-2 border border-border/50 bg-muted">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Laycan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Sefer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span>Fixture</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
