import { NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/auth"

export async function POST() {
  try {
    await clearAuthCookie()
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Signout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
