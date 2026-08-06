import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { handleApiError } from "@/lib/api-error"
import { validatePassword } from "@/lib/password-policy"

export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json()

    if (!token || !name || !password) {
      return NextResponse.json({ error: "Tüm alanlar gerekli" }, { status: 400 })
    }

    const invitations = await sql`
      SELECT * FROM user_invitations
      WHERE token = ${token}
      AND accepted = false
      AND expires > CURRENT_TIMESTAMP
    `

    if (invitations.length === 0) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş davet" }, { status: 400 })
    }

    const invitation = invitations[0]

    // Davet akışında da aynı parola politikası geçerlidir.
    validatePassword(password, { email: invitation.email, name })

    let userId
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${invitation.email}
    `

    if (existingUsers.length > 0) {
      // Mevcut kullanıcı: parolası DEĞİŞTİRİLMEZ. Aksi halde bir davet
      // bağlantısı, var olan bir hesabın parolasını ele geçirmek için
      // kullanılabilirdi.
      userId = existingUsers[0].id
    } else {
      const passwordHash = await bcrypt.hash(password, 12)
      const newUser = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name.trim()}, ${invitation.email}, ${passwordHash})
        RETURNING id
      `
      userId = newUser[0].id
    }

    await sql`
      INSERT INTO user_permissions (user_id, company_id, role, is_active)
      VALUES (${userId}, ${invitation.company_id}, ${invitation.role}, true)
      ON CONFLICT (user_id, company_id) DO NOTHING
    `

    await sql`
      UPDATE user_invitations
      SET accepted = true
      WHERE id = ${invitation.id}
    `

    return NextResponse.json({ message: "Davet kabul edildi" })
  } catch (error) {
    return handleApiError(error, "Davet kabul")
  }
}
