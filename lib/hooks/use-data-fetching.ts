"use client"

import useSWR, { type SWRConfiguration } from "swr"
import { useCallback } from "react"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch data")
  }
  return response.json()
}

export function useDataFetching<T>(url: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    ...options,
  })

  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  return {
    data,
    error,
    isLoading,
    refresh,
    mutate,
  }
}

export function useShips(filters?: { status?: string; type?: string }) {
  const params = new URLSearchParams()
  if (filters?.status && filters.status !== "all") params.append("status", filters.status)
  if (filters?.type && filters.type !== "all") params.append("type", filters.type)

  const url = `/api/ships${params.toString() ? `?${params}` : ""}`
  return useDataFetching<any[]>(url)
}

export function useFixtures(filters?: { shipId?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.shipId && filters.shipId !== "all") params.append("shipId", filters.shipId)
  if (filters?.status && filters.status !== "all") params.append("status", filters.status)

  const url = `/api/fixtures${params.toString() ? `?${params}` : ""}`
  return useDataFetching<any[]>(url)
}

export function useVoyages(filters?: { shipId?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.shipId && filters.shipId !== "all") params.append("shipId", filters.shipId)
  if (filters?.status && filters.status !== "all") params.append("status", filters.status)

  const url = `/api/voyages${params.toString() ? `?${params}` : ""}`
  return useDataFetching<any[]>(url)
}
