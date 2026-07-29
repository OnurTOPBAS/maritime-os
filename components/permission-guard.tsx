"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { Permission } from "@/lib/permissions"

interface PermissionGuardProps {
  children: React.ReactNode
  companyId: string
  action: keyof Permission
  fallback?: React.ReactNode
}

export function PermissionGuard({ children, companyId, action, fallback }: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPermission()
  }, [companyId, action])

  const checkPermission = async () => {
    try {
      const response = await fetch(`/api/permissions/check?companyId=${companyId}&action=${action}`)
      const data = await response.json()
      setHasPermission(data.hasPermission)
    } catch (error) {
      console.error("Error checking permission:", error)
      setHasPermission(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (!hasPermission) {
    return fallback || null
  }

  return <>{children}</>
}
