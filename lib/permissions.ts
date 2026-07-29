import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export type UserRole = "admin" | "manager" | "viewer"

export interface Permission {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  manager: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  },
  viewer: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
}

export async function getUserPermissions(userId: string, companyId: string): Promise<Permission> {
  try {
    console.log("[v0] getUserPermissions called:", { userId, companyId })

    const result = await sql`
      SELECT role FROM user_permissions
      WHERE user_id = ${userId} AND company_id = ${companyId}
    `

    console.log("[v0] user_permissions query result:", {
      found: result.length > 0,
      role: result.length > 0 ? result[0].role : null,
    })

    if (result.length === 0) {
      // Check if user is company owner
      const ownerCheck = await sql`
        SELECT id FROM companies
        WHERE id = ${companyId} AND owner_id = ${userId}
      `

      console.log("[v0] Company owner check:", {
        isOwner: ownerCheck.length > 0,
        companyId,
        userId,
      })

      if (ownerCheck.length > 0) {
        console.log("[v0] User is company owner, granting admin permissions")
        return ROLE_PERMISSIONS.admin
      }

      console.log("[v0] User not found in permissions and not owner, defaulting to viewer")
      return ROLE_PERMISSIONS.viewer
    }

    const role = result[0].role as UserRole
    console.log("[v0] User has role:", role)
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer
  } catch (error) {
    console.error("[v0] Error getting user permissions:", error)
    return ROLE_PERMISSIONS.viewer
  }
}

export async function checkPermission(userId: string, companyId: string, action: keyof Permission): Promise<boolean> {
  const permissions = await getUserPermissions(userId, companyId)
  return permissions[action]
}

export async function requirePermission(userId: string, companyId: string, action: keyof Permission) {
  const hasPermission = await checkPermission(userId, companyId, action)
  if (!hasPermission) {
    throw new Error(`Insufficient permissions: ${action} not allowed`)
  }
}

export async function getUserCompanies(userId: string) {
  try {
    const companies = await sql`
      SELECT c.*, up.role
      FROM companies c
      LEFT JOIN user_permissions up ON c.id = up.company_id AND up.user_id = ${userId}
      WHERE c.owner_id = ${userId} OR up.user_id = ${userId}
      ORDER BY c.name
    `
    return companies
  } catch (error) {
    console.error("Error getting user companies:", error)
    return []
  }
}
