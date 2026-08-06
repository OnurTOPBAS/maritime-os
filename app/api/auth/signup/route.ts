import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { handleApiError } from "@/lib/api-error"
import { validateEmail, validatePassword } from "@/lib/password-policy"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Ad zorunludur" }, { status: 400 })
    }

    // Önceden hiçbir kural yoktu: tek karakterli parola kabul ediliyordu.
    const normalizedEmail = validateEmail(email)
    validatePassword(password, { email: normalizedEmail, name })

    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const newUsers = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name.trim()}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, name, email, created_at
    `

    const user = newUsers[0]

    const { createToken, setAuthCookie } = await import("@/lib/auth")
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    await setAuthCookie(token)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Kayıt")
  }
}
