import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAuth } from "@/lib/session"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const voyageId = params.id

    const fuelRecords = await sql`
      SELECT 
        fr.*
      FROM fuel_records fr
      JOIN voyages v ON fr.voyage_id = v.id
      JOIN fixtures f ON v.fixture_id = f.id
      JOIN ships s ON f.ship_id = s.id
      JOIN fleets fl ON s.fleet_id = fl.id
      JOIN companies c ON fl.company_id = c.id
      LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
      WHERE fr.voyage_id = ${voyageId}
      AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
      ORDER BY fr.record_date ASC, fr.created_at ASC
    `

    const recordsWithSeaConsumption = fuelRecords.map((record, index) => {
      if (index > 0 && record.leg_type === "arrival") {
        const previousRecord = fuelRecords[index - 1]
        if (previousRecord.leg_type === "departure" && previousRecord.fuel_type === record.fuel_type) {
          const seaConsumption = (previousRecord.departure_rob || 0) - (record.arrival_rob || 0)
          return { ...record, sea_consumption: seaConsumption > 0 ? seaConsumption : 0 }
        }
      }
      return record
    })

    return NextResponse.json(recordsWithSeaConsumption)
  } catch (error) {
    console.error("Error fetching fuel records:", error)
    return NextResponse.json({ error: "Failed to fetch fuel records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const voyageId = params.id

    const portConsumption = data.arrival_rob && data.departure_rob ? data.arrival_rob - data.departure_rob : null

    const totalCost = data.price_per_ton && portConsumption ? portConsumption * data.price_per_ton : null

    const result = await sql`
      INSERT INTO fuel_records (
        voyage_id,
        port,
        fuel_type,
        arrival_rob,
        departure_rob,
        port_consumption,
        record_date,
        leg_type,
        price_per_ton,
        total_cost,
        created_by
      ) VALUES (
        ${voyageId},
        ${data.port},
        ${data.fuel_type},
        ${data.arrival_rob},
        ${data.departure_rob},
        ${portConsumption},
        ${data.record_date},
        ${data.leg_type},
        ${data.price_per_ton},
        ${totalCost},
        ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating fuel record:", error)
    return NextResponse.json({ error: "Failed to create fuel record" }, { status: 500 })
  }
}
