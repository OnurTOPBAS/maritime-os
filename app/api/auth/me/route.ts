import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Error fetching current user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
