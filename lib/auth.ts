import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { sql } from "./db"
import bcrypt from "bcryptjs"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set")
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export interface User {
  id: string
  email: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(user: User): Promise<string> {
  return new SignJWT({ userId: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as { userId: string; email: string; name: string }
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")

  if (!token) {
    return null
  }

  return verifyToken(token.value)
}

export async function getCurrentUser(): Promise<User | null> {
  return getSession()
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  // Çerez yalnızca uygulama HTTPS'ten sunuluyorsa "Secure" olur. İç ağda düz
  // HTTP (http://SUNUCU-IP:3000) kullanıldığında Secure çerez tarayıcı
  // tarafından saklanmaz ve başka makinelerden giriş yapılamazdı; bu yüzden
  // Secure bayrağı NODE_ENV yerine APP_URL protokolünden türetilir.
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  const secure = appUrl.startsWith("https://")
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const users = await sql`
    SELECT * FROM users WHERE email = ${email}
  `

  const user = users[0]

  if (!user || !user.password_hash) {
    return null
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
}

export async function hasCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM companies c
    WHERE c.id = ${companyId}
    AND (
      c.owner_id = ${userId}
      OR EXISTS (
        SELECT 1 FROM company_team_members ctm
        WHERE ctm.company_id = ${companyId}
        AND ctm.user_id = ${userId}
      )
    )
  `
  return result.length > 0
}
