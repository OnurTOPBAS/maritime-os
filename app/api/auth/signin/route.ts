import { NextResponse } from "next/server"
import { authenticateUser, createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await createToken(user)
    await setAuthCookie(token)

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error("[v0] Signin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
