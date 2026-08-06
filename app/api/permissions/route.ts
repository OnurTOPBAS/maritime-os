import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-error"

export async function GET() {
  try {
    // İzin kataloğu sistemin yetki haritasıdır; herkese açık olmamalı.
    await requireAuth()

    const permissions = await sql`
      SELECT * FROM permissions
      ORDER BY module, action
    `
    return NextResponse.json(permissions)
  } catch (error) {
    return handleApiError(error, "İzin listesi")
  }
}
