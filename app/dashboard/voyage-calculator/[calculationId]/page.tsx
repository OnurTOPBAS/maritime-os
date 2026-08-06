"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { VoyageCalculatorWizard } from "@/components/voyage-calculator-wizard"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function VoyageCalculatorDetailPage({ params }: { params: Promise<{ calculationId: string }> }) {
  const resolvedParams = use(params)
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
    <DashboardLayout user={user}>
      <VoyageCalculatorWizard calculationId={resolvedParams.calculationId} />
    </DashboardLayout>
  )
}
