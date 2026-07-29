import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = params

    const userCompanies = await sql`
      SELECT c.id FROM companies c
      WHERE c.owner_id = ${user.id}
      UNION
      SELECT ctm.company_id as id FROM company_team_members ctm
      WHERE ctm.user_id = ${user.id}
      LIMIT 1
    `

    if (userCompanies.length === 0) {
      return NextResponse.json({ error: "No company found" }, { status: 403 })
    }

    const companyId = userCompanies[0].id

    const task = await sql`
      SELECT 
        t.*,
        u1.name as assigned_to_name,
        u1.email as assigned_to_email,
        u2.name as assigned_by_name,
        u2.email as assigned_by_email,
        s.name as ship_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      LEFT JOIN ships s ON t.ship_id = s.id
      WHERE t.id = ${taskId} AND t.company_id = ${companyId}
    `

    if (task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Get comments
    const comments = await sql`
      SELECT 
        tc.*,
        u.name as user_name,
        u.email as user_email
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ${taskId}
      ORDER BY tc.created_at ASC
    `

    // Get activity
    const activity = await sql`
      SELECT 
        ta.*,
        u.name as user_name
      FROM task_activity ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = ${taskId}
      ORDER BY ta.created_at DESC
      LIMIT 50
    `

    const watchers = await sql`
      SELECT 
        tw.user_id,
        u.name as user_name,
        u.email as user_email
      FROM task_watchers tw
      LEFT JOIN users u ON tw.user_id = u.id
      WHERE tw.task_id = ${taskId}
      ORDER BY u.name ASC
    `

    return NextResponse.json({
      task: task[0],
      comments,
      activity,
      watchers, // Include watchers in response
    })
  } catch (error) {
    console.error("[v0] Error fetching task:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = params
    const body = await request.json()

    console.log("[v0] PUT request received:", { taskId, body })

    const { title, description, category, priority, status, assignedTo, shipId, startDate, dueDate, tags } = body

    const userCompanies = await sql`
      SELECT c.id FROM companies c
      WHERE c.owner_id = ${user.id}
      UNION
      SELECT ctm.company_id as id FROM company_team_members ctm
      WHERE ctm.user_id = ${user.id}
      LIMIT 1
    `

    if (userCompanies.length === 0) {
      return NextResponse.json({ error: "No company found" }, { status: 403 })
    }

    const companyId = userCompanies[0].id

    const currentTask = await sql`
      SELECT * FROM tasks WHERE id = ${taskId} AND company_id = ${companyId}
    `

    if (currentTask.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    let updatedTask

    if (status !== undefined) {
      // Quick status update (most common case)
      if (status === "completed") {
        updatedTask = await sql`
          UPDATE tasks
          SET status = ${status}, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId} AND company_id = ${companyId}
          RETURNING *
        `
      } else {
        updatedTask = await sql`
          UPDATE tasks
          SET status = ${status}, completed_at = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId} AND company_id = ${companyId}
          RETURNING *
        `
      }

      // Log activity
      await sql`
        INSERT INTO task_activity (task_id, user_id, action, changes)
        VALUES (${taskId}, ${user.id}, 'status_changed', ${JSON.stringify({ status: { old: currentTask[0].status, new: status } })})
      `
    } else {
      // Full task update
      updatedTask = await sql`
        UPDATE tasks
        SET 
          title = COALESCE(${title}, title),
          description = COALESCE(${description}, description),
          category = COALESCE(${category}, category),
          priority = COALESCE(${priority}, priority),
          assigned_to = COALESCE(${assignedTo}, assigned_to),
          ship_id = COALESCE(${shipId}, ship_id),
          start_date = COALESCE(${startDate}::timestamp, start_date),
          due_date = COALESCE(${dueDate}::timestamp, due_date),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId} AND company_id = ${companyId}
        RETURNING *
      `

      // Log activity
      const changes: any = {}
      if (title !== undefined && title !== currentTask[0].title)
        changes.title = { old: currentTask[0].title, new: title }
      if (description !== undefined && description !== currentTask[0].description)
        changes.description = { old: currentTask[0].description, new: description }
      if (category !== undefined && category !== currentTask[0].category)
        changes.category = { old: currentTask[0].category, new: category }
      if (priority !== undefined && priority !== currentTask[0].priority)
        changes.priority = { old: currentTask[0].priority, new: priority }
      if (assignedTo !== undefined && assignedTo !== currentTask[0].assigned_to)
        changes.assigned_to = { old: currentTask[0].assigned_to, new: assignedTo }
      if (shipId !== undefined && shipId !== currentTask[0].ship_id)
        changes.ship_id = { old: currentTask[0].ship_id, new: shipId }

      if (Object.keys(changes).length > 0) {
        await sql`
          INSERT INTO task_activity (task_id, user_id, action, changes)
          VALUES (${taskId}, ${user.id}, 'updated', ${JSON.stringify(changes)})
        `
      }
    }

    console.log("[v0] Task updated successfully:", updatedTask[0]?.id)

    if (!updatedTask || updatedTask.length === 0) {
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
    }

    return NextResponse.json({ task: updatedTask[0] })
  } catch (error) {
    console.error("[v0] Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = params

    const userCompanies = await sql`
      SELECT c.id FROM companies c
      WHERE c.owner_id = ${user.id}
      UNION
      SELECT ctm.company_id as id FROM company_team_members ctm
      WHERE ctm.user_id = ${user.id}
      LIMIT 1
    `

    if (userCompanies.length === 0) {
      return NextResponse.json({ error: "No company found" }, { status: 403 })
    }

    const companyId = userCompanies[0].id

    await sql`
      DELETE FROM tasks
      WHERE id = ${taskId} AND company_id = ${companyId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
