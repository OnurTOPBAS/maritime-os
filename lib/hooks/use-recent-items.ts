import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useRecentItems(limit = 10) {
  const { data, error, mutate } = useSWR(`/api/recent-items?limit=${limit}`, fetcher)

  const trackView = async (entityType: string, entityId: string, entityName: string) => {
    try {
      await fetch("/api/recent-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, entityName }),
      })
      mutate()
    } catch (error) {
      console.error("Failed to track view:", error)
    }
  }

  return {
    recentItems: data || [],
    isLoading: !error && !data,
    error,
    trackView,
    mutate,
  }
}
