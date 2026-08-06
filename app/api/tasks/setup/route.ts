import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK (category IN (
          'maintenance', 'inspection', 'documentation', 'compliance',
          'crew_management', 'certificate_renewal', 'port_operations',
          'cargo_operations', 'safety', 'other'
        )),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
        status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')) DEFAULT 'todo',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
        start_date TIMESTAMP,
        due_date TIMESTAMP,
        completed_at TIMESTAMP,
        tags TEXT[] DEFAULT '{}',
        attachments JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS task_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS task_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        changes JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS task_watchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, user_id)
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id)`


    return NextResponse.json({
      success: true,
      message: "Görev yönetimi tabloları başarıyla oluşturuldu",
    })
  } catch (error: any) {
    console.error("[v0] Error setting up task tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to setup task tables",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
