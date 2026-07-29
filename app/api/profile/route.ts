import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/session"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

function calculateProfileCompletion(profile: any): number {
  const fields = [
    profile.name,
    profile.email,
    profile.phone,
    profile.position,
    profile.department,
    profile.birth_date,
    profile.address,
    profile.bio,
    profile.profile_photo_url,
    profile.signature_url,
    profile.linkedin_url || profile.twitter_url,
  ]

  const filledFields = fields.filter((field) => field && field.toString().trim() !== "").length
  return Math.round((filledFields / fields.length) * 100)
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await sql`
      SELECT 
        id, name, email, phone, position, department, birth_date, address, bio,
        profile_photo_url, signature_url, linkedin_url, twitter_url,
        timezone, language, notification_email, notification_push, notification_sms,
        profile_completion, created_at
      FROM users
      WHERE id = ${user.id}
    `

    if (profile.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(profile[0])
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      position,
      department,
      birth_date,
      address,
      bio,
      profile_photo_url,
      signature_url,
      linkedin_url,
      twitter_url,
      timezone,
      language,
      notification_email,
      notification_push,
      notification_sms,
      currentPassword,
      newPassword,
    } = body

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Mevcut şifre gerekli" }, { status: 400 })
      }

      const userWithPassword = await sql`
        SELECT password_hash FROM users WHERE id = ${user.id}
      `

      if (userWithPassword.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword[0].password_hash)

      if (!isValidPassword) {
        return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 })
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalı" }, { status: 400 })
      }

      const passwordHash = await bcrypt.hash(newPassword, 10)
      await sql`
        UPDATE users
        SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
      `
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${user.id}
      `

      if (existingUser.length > 0) {
        return NextResponse.json({ error: "Bu email zaten kullanılıyor" }, { status: 400 })
      }
    }

    const profileCompletion = calculateProfileCompletion({
      name,
      email,
      phone,
      position,
      department,
      birth_date,
      address,
      bio,
      profile_photo_url,
      signature_url,
      linkedin_url,
      twitter_url,
    })

    await sql`
      UPDATE users
      SET 
        name = ${name},
        email = ${email},
        phone = ${phone || null},
        position = ${position || null},
        department = ${department || null},
        birth_date = ${birth_date || null},
        address = ${address || null},
        bio = ${bio || null},
        profile_photo_url = ${profile_photo_url || null},
        signature_url = ${signature_url || null},
        linkedin_url = ${linkedin_url || null},
        twitter_url = ${twitter_url || null},
        timezone = ${timezone || "Europe/Istanbul"},
        language = ${language || "tr"},
        notification_email = ${notification_email ?? true},
        notification_push = ${notification_push ?? true},
        notification_sms = ${notification_sms ?? false},
        profile_completion = ${profileCompletion},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `

    const updatedProfile = await sql`
      SELECT 
        id, name, email, phone, position, department, birth_date, address, bio,
        profile_photo_url, signature_url, linkedin_url, twitter_url,
        timezone, language, notification_email, notification_push, notification_sms,
        profile_completion, created_at
      FROM users
      WHERE id = ${user.id}
    `

    return NextResponse.json(updatedProfile[0])
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
