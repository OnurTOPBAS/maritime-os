import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getAccessibleCompanyIds } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"


async function checkTasksTableExists(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
        AND column_name = 'company_id'
      ) as exists
    `
    return result[0]?.exists || false
  } catch (error: any) {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tableExists = await checkTasksTableExists()
    if (!tableExists) {
      return NextResponse.json(
        {
          tasks: [],
          setupRequired: true,
          message:
            "Görev yönetimi tabloları henüz oluşturulmamış veya güncel değil. Kurulum butonuna tıklayarak tabloları oluşturabilirsiniz.",
        },
        { status: 200 },
      )
    }

    // Kullanıcının eriştiği TÜM şirketler. Önceki kod LIMIT 1 ile rastgele
    // tek şirket seçiyordu; birden fazla şirketi olan kullanıcı diğer
    // görevlerini hiç göremiyordu.
    const companyIds = await getAccessibleCompanyIds(user.id)
    if (companyIds.length === 0) {
      return NextResponse.json({ tasks: [] })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assignedTo")
    const shipId = searchParams.get("shipId")
    const category = searchParams.get("category")

    /*
     * SQL ENJEKSİYONU DÜZELTMESİ
     *
     * Önceki kod filtreleri sorgu metnine doğrudan birleştirip sql.unsafe ile
     * çalıştırıyordu:
     *     query += ` AND t.status = '${status}'`
     * Bu, `?status=x' OR '1'='1` gibi bir parametreyle WHERE koşulunun
     * atlatılmasına ve UNION SELECT ile başka tablolardan (ör. users) veri
     * çekilmesine olanak tanıyordu.
     *
     * Artık tüm filtreler parametre olarak gönderilir; NULL ise koşul devre
     * dışı kalır. Değerler asla SQL metnine gömülmez.
     */
    const tasks = await sql`
      SELECT
        t.*,
        u1.name as assigned_to_name,
        u1.email as assigned_to_email,
        u2.name as assigned_by_name,
        u2.email as assigned_by_email,
        s.name as ship_name,
        (SELECT COUNT(*)::int FROM task_comments WHERE task_id = t.id) as comment_count,
        (SELECT COUNT(*)::int FROM task_watchers WHERE task_id = t.id) as watcher_count
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      LEFT JOIN ships s ON t.ship_id = s.id
      WHERE t.company_id = ANY(${companyIds}::uuid[])
        AND (${status ?? null}::text  IS NULL OR t.status      = ${status ?? null}::text)
        AND (${assignedTo ?? null}::uuid IS NULL OR t.assigned_to = ${assignedTo ?? null}::uuid)
        AND (${shipId ?? null}::uuid  IS NULL OR t.ship_id     = ${shipId ?? null}::uuid)
        AND (${category ?? null}::text IS NULL OR t.category    = ${category ?? null}::text)
      ORDER BY t.created_at DESC
    `

    return NextResponse.json({ tasks: tasks || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching tasks:", error.message)
    if (error.message && error.message.includes("does not exist")) {
      return NextResponse.json(
        {
          tasks: [],
          setupRequired: true,
          message: "Görev yönetimi tabloları güncellenmelidir. Lütfen kurulum butonuna tıklayın.",
        },
        { status: 200 },
      )
    }
    return NextResponse.json({ tasks: [], error: "Failed to fetch tasks" }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tableExists = await checkTasksTableExists()
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Görev yönetimi tabloları henüz oluşturulmamış veya güncel değil. Lütfen önce kurulum yapın.",
          setupRequired: true,
        },
        { status: 400 },
      )
    }

    const userCompanies = await sql`
      SELECT c.id FROM companies c
      WHERE c.owner_id = ${user.id}
      UNION
      SELECT ctm.company_id as id FROM company_team_members ctm
      WHERE ctm.user_id = ${user.id}
      LIMIT 1
    `

    if (!userCompanies || userCompanies.length === 0) {
      return NextResponse.json({ error: "User has no company" }, { status: 400 })
    }

    const companyId = userCompanies[0].id

    const body = await request.json()
    const {
      title,
      description,
      category,
      priority = "medium",
      assignedTo,
      shipId,
      startDate,
      dueDate,
      tags = [],
      additionalAssignees = [], // Added support for multiple assignees
    } = body

    if (!title || !category) {
      return NextResponse.json({ error: "Title and category are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO tasks (
        company_id, title, description, category, priority,
        assigned_to, assigned_by, ship_id, start_date, due_date, tags
      )
      VALUES (
        ${companyId}, ${title}, ${description}, ${category}, ${priority},
        ${assignedTo || null}, ${user.id}, ${shipId || null},
        ${startDate || null}, ${dueDate || null}, ${tags}
      )
      RETURNING *
    `

    const taskId = result[0].id

    if (additionalAssignees.length > 0) {
      for (const userId of additionalAssignees) {
        try {
          await sql`
            INSERT INTO task_watchers (task_id, user_id)
            VALUES (${taskId}, ${userId})
            ON CONFLICT (task_id, user_id) DO NOTHING
          `

          // Create notification for additional assignees
          await sql`
            INSERT INTO notifications (user_id, type, title, message, link, metadata)
            VALUES (
              ${userId},
              'task_assigned',
              'Göreve Eklendiniz',
              'Bir göreve ek sorumlu olarak eklendiniz: ' || ${title},
              '/dashboard/tasks/' || ${taskId},
              ${JSON.stringify({
                taskId,
                taskTitle: title,
                assignedBy: user.id,
                priority,
                dueDate,
              })}
            )
          `
        } catch (error) {
          console.error("[v0] Error adding watcher:", error)
        }
      }
    }

    // Log activity
    await sql`
      INSERT INTO task_activity (task_id, user_id, action, changes)
      VALUES (
        ${taskId},
        ${user.id},
        'created',
        ${JSON.stringify({ title, category, priority, additionalAssignees })}
      )
    `

    return NextResponse.json({ task: result[0] })
  } catch (error: any) {
    console.error("[v0] Error creating task:", error.message)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
