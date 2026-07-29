import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export type Module = "ships" | "fixtures" | "voyages" | "invoices" | "reports" | "users" | "settings"
export type DataScope = "all" | "own" | "department"

export interface CustomPermission {
  module: Module
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
  dataScope: DataScope
}

export interface ModulePermissions {
  [key: string]: CustomPermission
}

// Get custom permissions for a user
export async function getCustomPermissions(userId: number, companyId: number): Promise<ModulePermissions> {
  try {
    const permissions = await sql`
      SELECT 
        module,
        can_view,
        can_create,
        can_edit,
        can_delete,
        can_export,
        data_scope
      FROM custom_permissions
      WHERE user_id = ${userId} AND company_id = ${companyId}
    `

    const result: ModulePermissions = {}
    for (const perm of permissions) {
      result[perm.module] = {
        module: perm.module as Module,
        canView: perm.can_view,
        canCreate: perm.can_create,
        canEdit: perm.can_edit,
        canDelete: perm.can_delete,
        canExport: perm.can_export,
        dataScope: perm.data_scope as DataScope,
      }
    }

    return result
  } catch (error) {
    console.error("Error getting custom permissions:", error)
    return {}
  }
}

// Check if user has permission for a specific module and action
export async function hasModulePermission(
  userId: number,
  companyId: number,
  module: Module,
  action: "view" | "create" | "edit" | "delete" | "export",
): Promise<boolean> {
  try {
    // First check if user is admin (has full access)
    const roleCheck = await sql`
      SELECT role FROM user_permissions
      WHERE user_id = ${userId} AND company_id = ${companyId}
    `

    if (roleCheck.length > 0 && roleCheck[0].role === "admin") {
      return true
    }

    // Check custom permissions
    const permission = await sql`
      SELECT can_view, can_create, can_edit, can_delete, can_export
      FROM custom_permissions
      WHERE user_id = ${userId} 
        AND company_id = ${companyId}
        AND module = ${module}
    `

    if (permission.length === 0) {
      // No custom permission set, use role-based defaults
      if (roleCheck.length > 0) {
        const role = roleCheck[0].role
        if (role === "manager") {
          return action !== "delete"
        } else if (role === "viewer") {
          return action === "view"
        }
      }
      return false
    }

    const perm = permission[0]
    switch (action) {
      case "view":
        return perm.can_view
      case "create":
        return perm.can_create
      case "edit":
        return perm.can_edit
      case "delete":
        return perm.can_delete
      case "export":
        return perm.can_export
      default:
        return false
    }
  } catch (error) {
    console.error("Error checking module permission:", error)
    return false
  }
}

// Set custom permissions for a user
export async function setCustomPermissions(
  userId: number,
  companyId: number,
  module: Module,
  permissions: Partial<CustomPermission>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO custom_permissions (
        user_id, company_id, module,
        can_view, can_create, can_edit, can_delete, can_export, data_scope
      ) VALUES (
        ${userId}, ${companyId}, ${module},
        ${permissions.canView ?? true},
        ${permissions.canCreate ?? false},
        ${permissions.canEdit ?? false},
        ${permissions.canDelete ?? false},
        ${permissions.canExport ?? false},
        ${permissions.dataScope ?? "all"}
      )
      ON CONFLICT (user_id, company_id, module)
      DO UPDATE SET
        can_view = ${permissions.canView ?? true},
        can_create = ${permissions.canCreate ?? false},
        can_edit = ${permissions.canEdit ?? false},
        can_delete = ${permissions.canDelete ?? false},
        can_export = ${permissions.canExport ?? false},
        data_scope = ${permissions.dataScope ?? "all"},
        updated_at = CURRENT_TIMESTAMP
    `
  } catch (error) {
    console.error("Error setting custom permissions:", error)
    throw error
  }
}
