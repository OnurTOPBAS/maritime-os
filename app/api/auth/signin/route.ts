import { NextResponse } from "next/server"
import { authenticateUser, createToken, setAuthCookie } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import {
  checkLoginRateLimit,
  clearFailedAttempts,
  getClientIp,
  recordLoginAttempt,
} from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "E-posta ve şifre gereklidir" }, { status: 400 })
    }

    const ip = getClientIp(request)

    // Parola denenmeden ÖNCE sınır kontrol edilir; aksi halde saldırgan
    // sınırsız deneme yapabilir (G-07).
    await checkLoginRateLimit(email, ip)

    const user = await authenticateUser(email, password)

    if (!user) {
      await recordLoginAttempt(email, ip, false)
      // Hesabın var olup olmadığı sızdırılmaz: her iki durumda aynı mesaj.
      return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 })
    }

    await recordLoginAttempt(email, ip, true)
    await clearFailedAttempts(email)

    const token = await createToken(user)
    await setAuthCookie(token)

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    return handleApiError(error, "Giriş")
  }
}
