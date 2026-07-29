import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

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
    console.log("[v0] Error checking table existence:", error.message)
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
      console.log("[v0] Tasks table not found or missing company_id column - setup required")
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

    const userCompanies = await sql`
      SELECT c.id FROM companies c
      WHERE c.owner_id = ${user.id}
      UNION
      SELECT ctm.company_id as id FROM company_team_members ctm
      WHERE ctm.user_id = ${user.id}
      LIMIT 1
    `

    if (!userCompanies || userCompanies.length === 0) {
      console.log("[v0] User has no company, returning empty tasks")
      return NextResponse.json({ tasks: [] })
    }

    const companyId = userCompanies[0].id

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assignedTo")
    const shipId = searchParams.get("shipId")
    const category = searchParams.get("category")

    console.log("[v0] Fetching tasks with filters:", { companyId, status, assignedTo, shipId, category })

    let tasks
    if (!status && !assignedTo && !shipId && !category) {
      tasks = await sql`
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
        WHERE t.company_id = ${companyId}
        ORDER BY t.created_at DESC
      `
    } else {
      // Build filtered query
      let query = `
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
        WHERE t.company_id = '${companyId}'
      `

      if (status) query += ` AND t.status = '${status}'`
      if (assignedTo) query += ` AND t.assigned_to = '${assignedTo}'`
      if (shipId) query += ` AND t.ship_id = '${shipId}'`
      if (category) query += ` AND t.category = '${category}'`

      query += ` ORDER BY t.created_at DESC`

      tasks = await sql.unsafe(query)
    }

    console.log("[v0] Tasks fetched successfully:", tasks?.length || 0)

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
