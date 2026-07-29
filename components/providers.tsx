"use client"

import type React from "react"
import { SWRConfig } from "swr"
import { ToastProvider } from "@/components/toast-provider"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 30000, // Auto-refresh every 30 seconds
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        onError: (error) => {
          console.error("[v0] SWR Error:", error)
        },
      }}
    >
      <ToastProvider>
        <KeyboardShortcuts />
        {children}
      </ToastProvider>
    </SWRConfig>
  )
}
