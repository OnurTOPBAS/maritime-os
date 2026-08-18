"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ModuleGuard } from "@/components/module-guard"
import { VoyageCalculatorMain } from "@/components/voyage-calculator-main"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function VoyageCalculatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const userRes = await fetch("/api/auth/me")
        if (!userRes.ok) {
          router.push("/auth/signin")
          return
        }
        const userData = await userRes.json()
        setUser(userData)
      } catch (error) {
        console.error("Error loading user:", error)
        router.push("/auth/signin")
      }
    }
    loadUser()
  }, [router])

  if (!user) {
    return null
  }

  return (
    <ModuleGuard module="voyage_calculator">
    <DashboardLayout user={user}>
      <VoyageCalculatorMain />
    </DashboardLayout>
    </ModuleGuard>
  )
}
