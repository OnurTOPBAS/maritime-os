import { type NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/utils"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const shipId = (await params).id

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    // Get all checklist items
    const checklistItems = await sql`
      SELECT 
        pci.*,
        spc.is_completed,
        spc.completed_by,
        spc.completed_date,
        spc.notes as completion_notes,
        u.name as completed_by_name
      FROM psc_checklist_items pci
      LEFT JOIN ship_preparation_checklist spc ON pci.id = spc.checklist_item_id AND spc.ship_id = ${shipId}
      LEFT JOIN users u ON spc.completed_by = u.id
      ORDER BY pci.category, pci.sort_order
    `

    // Group by category
    const groupedChecklist = checklistItems.reduce((acc: any, item: any) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {})

    // Calculate completion stats
    const totalItems = checklistItems.length
    const completedItems = checklistItems.filter((item: any) => item.is_completed).length
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    // Get recent PSC inspections
    const recentInspections = await sql`
      SELECT *
      FROM psc_inspections
      WHERE ship_id = ${shipId}
      ORDER BY inspection_date DESC
      LIMIT 5
    `

    return NextResponse.json({
      checklist: groupedChecklist,
      stats: {
        total: totalItems,
        completed: completedItems,
        percentage: completionPercentage,
      },
      recentInspections,
    })
  } catch (error) {
    console.error("[v0] Get PSC preparation error:", error)
    return NextResponse.json({ error: "Failed to get PSC preparation data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const shipId = (await params).id

    if (!isValidUUID(shipId)) {
      return NextResponse.json({ error: "Invalid ship ID" }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { checklistItemId, isCompleted, notes } = body

    if (!isValidUUID(checklistItemId)) {
      return NextResponse.json({ error: "Invalid checklist item ID" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO ship_preparation_checklist (ship_id, checklist_item_id, is_completed, completed_by, completed_date, notes)
      VALUES (
        ${shipId},
        ${checklistItemId},
        ${isCompleted},
        ${user.id},
        ${isCompleted ? new Date().toISOString() : null},
        ${notes || null}
      )
      ON CONFLICT (ship_id, checklist_item_id)
      DO UPDATE SET
        is_completed = ${isCompleted},
        completed_by = ${user.id},
        completed_date = ${isCompleted ? new Date().toISOString() : null},
        notes = ${notes || null},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update PSC checklist error:", error)
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 })
  }
}
