"use client"

import useSWR from "swr"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useFavorites(entityType?: string) {
  const { toast } = useToast()
  const url = entityType ? `/api/favorites?type=${entityType}` : "/api/favorites"

  const { data, error, mutate } = useSWR(url, fetcher)

  const addFavorite = async (entityType: string, entityId: string, entityName: string) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, entityName }),
      })

      if (!res.ok) throw new Error("Failed to add favorite")

      mutate()
      toast({
        title: "Favorilere eklendi",
        description: `${entityName} favorilerinize eklendi`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Favorilere eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const removeFavorite = async (entityType: string, entityId: string) => {
    try {
      const res = await fetch(`/api/favorites?type=${entityType}&id=${entityId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to remove favorite")

      mutate()
      toast({
        title: "Favorilerden kaldırıldı",
        description: "Öğe favorilerinizden kaldırıldı",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Favorilerden kaldırılırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const isFavorite = (entityType: string, entityId: string) => {
    if (!data) return false
    return data.some((fav: any) => fav.entity_type === entityType && fav.entity_id === entityId)
  }

  return {
    favorites: data || [],
    isLoading: !error && !data,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    mutate,
  }
}
