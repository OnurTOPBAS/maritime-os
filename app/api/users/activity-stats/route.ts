import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { sql } from "@/lib/db"
import { isSuperAdmin } from "@/lib/authz"


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Sistem geneli kullanıcı aktivitesi tüm şirketleri kapsar; yalnızca süper
    // yönetici görebilir. Diğerlerine boş döner (şirketler arası sızıntı olmaz).
    if (!(await isSuperAdmin(user.id))) {
      return NextResponse.json({
        activityByAction: [], activityByEntity: [], dailyActivity: [],
        mostActiveUsers: [], recentActivities: [],
      })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const days = searchParams.get("days") ? Number.parseInt(searchParams.get("days")!) : 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split("T")[0]

    // Total activities by action type
    const activityByAction = userId
      ? await sql`
          SELECT 
            action,
            COUNT(*) as count
          FROM audit_logs al
          WHERE created_at >= ${startDateStr}
            AND al.user_id = ${userId}
          GROUP BY action
          ORDER BY count DESC
        `
      : await sql`
          SELECT 
            action,
            COUNT(*) as count
          FROM audit_logs al
          WHERE created_at >= ${startDateStr}
          GROUP BY action
          ORDER BY count DESC
        `

    // Activities by entity type
    const activityByEntity = userId
      ? await sql`
          SELECT 
            entity_type,
            COUNT(*) as count
          FROM audit_logs al
          WHERE created_at >= ${startDateStr}
            AND al.user_id = ${userId}
          GROUP BY entity_type
          ORDER BY count DESC
        `
      : await sql`
          SELECT 
            entity_type,
            COUNT(*) as count
          FROM audit_logs al
          WHERE created_at >= ${startDateStr}
          GROUP BY entity_type
          ORDER BY count DESC
        `

    // Daily activity trend
    const dailyActivity = userId
      ? await sql`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM audit_logs al
          WHERE created_at >= ${startDateStr}
            AND al.user_id = ${userId}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `
      : await sql`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM audit_logs al
          WHERE created_at >= ${startDateStr}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `

    // Most active users (if not filtering by specific user)
    let mostActiveUsers = []
    if (!userId) {
      mostActiveUsers = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.profile_photo_url,
          COUNT(al.id) as activity_count,
          MAX(al.created_at) as last_activity
        FROM users u
        INNER JOIN audit_logs al ON al.user_id = u.id
        WHERE al.created_at >= ${startDateStr}
        GROUP BY u.id, u.name, u.email, u.profile_photo_url
        ORDER BY activity_count DESC
        LIMIT 10
      `
    }

    // Recent activities
    const recentActivities = userId
      ? await sql`
          SELECT 
            al.id,
            al.action,
            al.entity_type,
            al.entity_id,
            al.created_at,
            u.name as user_name,
            u.email as user_email,
            u.profile_photo_url
          FROM audit_logs al
          INNER JOIN users u ON u.id = al.user_id
          WHERE al.created_at >= ${startDateStr}
            AND al.user_id = ${userId}
          ORDER BY al.created_at DESC
          LIMIT 20
        `
      : await sql`
          SELECT 
            al.id,
            al.action,
            al.entity_type,
            al.entity_id,
            al.created_at,
            u.name as user_name,
            u.email as user_email,
            u.profile_photo_url
          FROM audit_logs al
          INNER JOIN users u ON u.id = al.user_id
          WHERE al.created_at >= ${startDateStr}
          ORDER BY al.created_at DESC
          LIMIT 20
        `

    return NextResponse.json({
      activityByAction,
      activityByEntity,
      dailyActivity,
      mostActiveUsers,
      recentActivities,
    })
  } catch (error) {
    console.error("Error fetching activity stats:", error)
    return NextResponse.json({ error: "Failed to fetch activity stats" }, { status: 500 })
  }
}
