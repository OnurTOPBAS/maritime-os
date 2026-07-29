"use client"

import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { createContext, useContext, type ReactNode } from "react"

type ToastContextType = {
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
  warning: (message: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()

  const success = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    })
  }

  const error = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "destructive",
    })
  }

  const info = (message: string, description?: string) => {
    toast({
      title: message,
      description,
    })
  }

  const warning = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    })
  }

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

export function useToastNotification() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToastNotification must be used within ToastProvider")
  }
  return context
}
