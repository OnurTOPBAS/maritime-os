"use client"

import React from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  /**
   * Eylem alanı. İki biçim desteklenir:
   *  - Hazır düğme için: { label, onClick }
   *  - Serbest içerik için: doğrudan JSX (koşullu render dâhil)
   */
  action?: React.ReactNode | { label: string; onClick: () => void }
}

/** Verilen değerin { label, onClick } biçiminde olup olmadığını anlar. */
function isButtonAction(value: unknown): value is { label: string; onClick: () => void } {
  return (
    typeof value === "object" &&
    value !== null &&
    !React.isValidElement(value) &&
    "label" in value &&
    "onClick" in value
  )
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-6 max-w-sm text-balance">{description}</p>}
        {isButtonAction(action) ? <Button onClick={action.onClick}>{action.label}</Button> : action}
      </CardContent>
    </Card>
  )
}
