import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token ve şifre gerekli" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalı" }, { status: 400 })
    }

    // Check if token exists and is valid
    const tokens = await sql`
      SELECT user_id, expires, used
      FROM password_reset_tokens
      WHERE token = ${token}
    `

    if (tokens.length === 0) {
      return NextResponse.json({ error: "Geçersiz token" }, { status: 400 })
    }

    const resetToken = tokens[0]

    // Check if token is expired
    if (new Date(resetToken.expires) < new Date()) {
      return NextResponse.json({ error: "Token süresi dolmuş" }, { status: 400 })
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json({ error: "Token zaten kullanılmış" }, { status: 400 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user password
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${resetToken.user_id}
    `

    // Mark token as used
    await sql`
      UPDATE password_reset_tokens
      SET used = true
      WHERE token = ${token}
    `

    return NextResponse.json({ message: "Şifre başarıyla güncellendi" })
  } catch (error) {
    console.error("Error in reset password:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}
