import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { isValidUUID } from "@/lib/utils"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sql`
      SELECT certificate_id FROM favorite_certificates
      WHERE user_id = ${user.id}
    `

    return NextResponse.json(result.map((r: any) => r.certificate_id))
  } catch (error) {
    console.error("[v0] Get favorites error:", error)
    return NextResponse.json({ error: "Failed to get favorites" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { certificateId } = body

    if (!isValidUUID(certificateId)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 })
    }

    await sql`
      INSERT INTO favorite_certificates (user_id, certificate_id)
      VALUES (${user.id}, ${certificateId})
      ON CONFLICT (user_id, certificate_id) DO NOTHING
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Add favorite error:", error)
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get("certificateId")

    if (!isValidUUID(certificateId)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 })
    }

    await sql`
      DELETE FROM favorite_certificates
      WHERE user_id = ${user.id} AND certificate_id = ${certificateId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Remove favorite error:", error)
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 })
  }
}
