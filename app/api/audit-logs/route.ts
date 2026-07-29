import { type NextRequest, NextResponse } from "next/server"
import { getActivityLogs } from "@/lib/audit-logger"
import { requireAuth } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const entityType = searchParams.get("entityType") || undefined
    const entityId = searchParams.get("entityId") || undefined
    const userId = searchParams.get("userId") || undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50

    const logs = await getActivityLogs({
      entityType,
      entityId,
      userId,
      limit,
    })

    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch activity logs" }, { status: 500 })
  }
}
