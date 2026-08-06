import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { handleApiError } from "@/lib/api-error"
import { validatePassword } from "@/lib/password-policy"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token ve şifre gerekli" }, { status: 400 })
    }

    const tokens = await sql`
      SELECT t.user_id, t.expires, t.used, u.email, u.name
      FROM password_reset_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE t.token = ${token}
    `

    if (tokens.length === 0) {
      return NextResponse.json({ error: "Geçersiz token" }, { status: 400 })
    }

    const resetToken = tokens[0]

    if (new Date(resetToken.expires) < new Date()) {
      return NextResponse.json({ error: "Token süresi dolmuş" }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ error: "Token zaten kullanılmış" }, { status: 400 })
    }

    // Tam politika uygulanır (önceden yalnızca uzunluğa bakılıyordu).
    validatePassword(password, { email: resetToken.email, name: resetToken.name })

    const passwordHash = await bcrypt.hash(password, 12)

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${resetToken.user_id}
    `

    await sql`
      UPDATE password_reset_tokens
      SET used = true
      WHERE token = ${token}
    `

    // Aynı kullanıcının bekleyen diğer sıfırlama tokenları da geçersiz kılınır.
    await sql`
      UPDATE password_reset_tokens
      SET used = true
      WHERE user_id = ${resetToken.user_id} AND used = false
    `

    return NextResponse.json({ message: "Şifre başarıyla güncellendi" })
  } catch (error) {
    return handleApiError(error, "Şifre sıfırlama")
  }
}
