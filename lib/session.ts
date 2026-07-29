import { getSession } from "./auth"

export { getSession }

export async function getCurrentUser() {
  return await getSession()
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}
