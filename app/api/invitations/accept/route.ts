import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json()

    if (!token || !name || !password) {
      return NextResponse.json({ error: "Tüm alanlar gerekli" }, { status: 400 })
    }

    // Get invitation
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

    // Check if user already exists
    let userId
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${invitation.email}
    `

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name}, ${invitation.email}, ${passwordHash})
        RETURNING id
      `
      userId = newUser[0].id
    }

    // Add user to company
    await sql`
      INSERT INTO user_permissions (user_id, company_id, role, is_active)
      VALUES (${userId}, ${invitation.company_id}, ${invitation.role}, true)
      ON CONFLICT (user_id, company_id) DO NOTHING
    `

    // Mark invitation as accepted
    await sql`
      UPDATE user_invitations
      SET accepted = true
      WHERE id = ${invitation.id}
    `

    return NextResponse.json({ message: "Davet kabul edildi" })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Davet kabul edilemedi" }, { status: 500 })
  }
}
