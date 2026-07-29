import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const action = searchParams.get("action")

    if (!companyId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const hasPermission = await checkPermission(user.id, companyId, action as any)

    return NextResponse.json({ hasPermission })
  } catch (error) {
    console.error("Error checking permission:", error)
    return NextResponse.json({ error: "Failed to check permission" }, { status: 500 })
  }
}
