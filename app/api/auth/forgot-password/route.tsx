import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getAppUrl } from "@/lib/app-url"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email gerekli" }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id, email, name FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.",
      })
    }

    const user = users[0]

    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const token = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires)
      VALUES (${user.id}, ${token}, ${expires})
    `

    // In production, send email here
    // For now, we'll just log the reset link
    const resetLink = `${getAppUrl()}/auth/reset-password?token=${token}`

    console.log(`[v0] Password reset link for ${email}: ${resetLink}`)

    // If EMAIL_API_KEY is available, send email
    if (process.env.EMAIL_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Şifre Sıfırlama Talebi",
            html: `
              <h2>Şifre Sıfırlama</h2>
              <p>Merhaba ${user.name},</p>
              <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
              <a href="${resetLink}">${resetLink}</a>
              <p>Bu link 1 saat geçerlidir.</p>
              <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
            `,
          }),
        })

        if (!emailResponse.ok) {
          console.error("[v0] Failed to send email:", await emailResponse.text())
        }
      } catch (emailError) {
        console.error("[v0] Error sending email:", emailError)
      }
    }

    return NextResponse.json({
      message: "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.",
    })
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}
