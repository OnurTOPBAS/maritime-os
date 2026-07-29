"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onDelete?: () => void
  onExport?: () => void
  onStatusUpdate?: (status: string) => void
  statusOptions?: Array<{ value: string; label: string }>
  customActions?: Array<{
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: () => void
    variant?: "default" | "destructive" | "outline"
  }>
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onExport,
  onStatusUpdate,
  statusOptions,
  customActions,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg animate-in slide-in-from-top-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {selectedCount} seçili
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4 mr-1" />
            Temizle
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {statusOptions && onStatusUpdate && (
            <Select onValueChange={onStatusUpdate}>
              <SelectTrigger className="w-[160px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue placeholder="Durum Güncelle" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {customActions?.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={action.onClick}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            )
          })}

          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
            >
              <Download className="h-4 w-4 mr-2" />
              İndir
            </Button>
          )}

          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
