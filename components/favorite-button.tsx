"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/lib/hooks/use-favorites"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  entityType: string
  entityId: string
  entityName: string
  className?: string
}

export function FavoriteButton({ entityType, entityId, entityName, className }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const favorite = isFavorite(entityType, entityId)

  const handleToggle = async () => {
    if (favorite) {
      await removeFavorite(entityType, entityId)
    } else {
      await addFavorite(entityType, entityId, entityName)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn(className)}
      title={favorite ? "Favorilerden kaldır" : "Favorilere ekle"}
    >
      <Star className={cn("h-4 w-4", favorite && "fill-yellow-400 text-yellow-400")} />
    </Button>
  )
}
