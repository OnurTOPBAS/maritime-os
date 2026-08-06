import { getSession } from "./auth"

export { getSession }

/** Oturum yoksa fırlatılır. Rotalar bunu 401'e çevirir. */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export async function getCurrentUser() {
  return await getSession()
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new UnauthorizedError()
  }
  return user
}
