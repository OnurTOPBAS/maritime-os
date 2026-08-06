import { sql } from "./db"


interface AuditLogData {
  userId: string
  entityType: string
  entityId: string
  action: "create" | "update" | "delete"
  changes?: {
    before?: any
    after?: any
    /** Serbest açıklama (ör. "X kaydından kopyalandı"). */
    note?: string
  }
  ipAddress?: string
  userAgent?: string
}

export async function logActivity(data: AuditLogData) {
  try {
    await sql`
      INSERT INTO audit_logs (
        user_id, entity_type, entity_id, action, changes, ip_address, user_agent
      ) VALUES (
        ${data.userId},
        ${data.entityType},
        ${data.entityId},
        ${data.action},
        ${JSON.stringify(data.changes || {})},
        ${data.ipAddress || null},
        ${data.userAgent || null}
      )
    `
  } catch (error) {
    console.error("[v0] Failed to log activity:", error)
  }
}

export async function getActivityLogs(filters?: {
  userId?: string
  entityType?: string
  entityId?: string
  limit?: number
}) {
  const limit = filters?.limit || 50

  if (filters?.entityId && filters?.entityType) {
    return await sql`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = ${filters.entityType}
        AND al.entity_id = ${filters.entityId}
      ORDER BY al.created_at DESC
      LIMIT ${limit}
    `
  }

  if (filters?.userId) {
    return await sql`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ${filters.userId}
      ORDER BY al.created_at DESC
      LIMIT ${limit}
    `
  }

  return await sql`
    SELECT 
      al.*,
      u.name as user_name,
      u.email as user_email
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ${limit}
  `
}
