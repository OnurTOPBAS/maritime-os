import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
