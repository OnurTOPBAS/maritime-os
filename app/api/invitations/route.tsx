import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { checkPermission } from "@/lib/permissions"
import { getAppUrl } from "@/lib/app-url"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    const canView = await checkPermission(user.id, companyId, "canView")
    if (!canView) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const invitations = await sql`
      SELECT 
        i.*,
        u.name as invited_by_name
      FROM user_invitations i
      LEFT JOIN users u ON i.invited_by = u.id
      WHERE i.company_id = ${companyId}
      AND i.accepted = false
      AND i.expires > CURRENT_TIMESTAMP
      ORDER BY i.created_at DESC
    `

    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, role, companyId } = body

    const canCreate = await checkPermission(user.id, companyId, "canCreate")
    if (!canCreate) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Check if user already exists in the company
    const existingUser = await sql`
      SELECT u.id
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      WHERE u.email = ${email} AND up.company_id = ${companyId}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Bu kullanıcı zaten şirkette mevcut" }, { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await sql`
      SELECT id FROM user_invitations
      WHERE email = ${email} 
      AND company_id = ${companyId}
      AND accepted = false
      AND expires > CURRENT_TIMESTAMP
    `

    if (existingInvitation.length > 0) {
      return NextResponse.json({ error: "Bu email için bekleyen bir davet var" }, { status: 400 })
    }

    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const token = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    const expires = new Date(Date.now() + 7 * 24 * 3600000) // 7 days from now

    // Create invitation
    const invitation = await sql`
      INSERT INTO user_invitations (company_id, email, role, token, invited_by, expires)
      VALUES (${companyId}, ${email}, ${role}, ${token}, ${user.id}, ${expires})
      RETURNING *
    `

    const inviteLink = `${getAppUrl()}/auth/accept-invitation?token=${token}`
    let emailSent = false
    let emailError = null

    if (process.env.EMAIL_API_KEY) {
      try {
        const company = await sql`SELECT name FROM companies WHERE id = ${companyId}`

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: email,
            subject: `${company[0].name} şirketine davet edildiniz`,
            html: `
              <h2>Şirket Daveti</h2>
              <p>${user.name} sizi ${company[0].name} şirketine davet etti.</p>
              <p>Rol: ${role}</p>
              <p>Daveti kabul etmek için aşağıdaki linke tıklayın:</p>
              <a href="${inviteLink}">${inviteLink}</a>
              <p>Bu davet 7 gün geçerlidir.</p>
            `,
          }),
        })

        if (emailResponse.ok) {
          emailSent = true
        } else {
          const errorData = await emailResponse.json()
          emailError = errorData.message
          console.error("[v0] Email sending failed:", errorData)
        }
      } catch (error) {
        console.error("[v0] Error sending invitation email:", error)
        emailError = error instanceof Error ? error.message : "Email gönderilemedi"
      }
    }

    // Return success with invitation link and email status
    return NextResponse.json(
      {
        ...invitation[0],
        inviteLink,
        emailSent,
        emailError,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}
