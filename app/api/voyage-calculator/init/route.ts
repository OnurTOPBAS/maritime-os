import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

// Auto-initialize tables if they don't exist
export async function POST() {
  try {
    // Bu uç nokta veritabanı şeması oluşturur (DDL). Önceden kimlik
    // doğrulaması yoktu: internetteki herkes çağırabiliyordu.
    // Şema normalde scripts/ altındaki migration'larla yönetilir.
    const user = await requireAuth()
    await requireSystemAdmin(user.id)

    // Read and execute the SQL script
    const sqlScript = `
      CREATE TABLE IF NOT EXISTS voyage_calculations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
        ship_name VARCHAR(255) NOT NULL,
        charterer VARCHAR(255),
        service_speed DECIMAL(5,2),
        running_cost_per_day DECIMAL(12,2),
        fuel_consumption JSONB DEFAULT '{}'::jsonb,
        total_distance DECIMAL(10,2) DEFAULT 0,
        total_sea_days DECIMAL(10,2) DEFAULT 0,
        total_port_days DECIMAL(10,2) DEFAULT 0,
        total_days DECIMAL(10,2) DEFAULT 0,
        total_fo_consumption DECIMAL(10,2) DEFAULT 0,
        total_mgo_consumption DECIMAL(10,2) DEFAULT 0,
        fo_price DECIMAL(10,2) DEFAULT 0,
        mgo_price DECIMAL(10,2) DEFAULT 0,
        fuel_cost DECIMAL(12,2) DEFAULT 0,
        running_cost DECIMAL(12,2) DEFAULT 0,
        other_costs DECIMAL(12,2) DEFAULT 0,
        total_cost DECIMAL(12,2) DEFAULT 0,
        total_revenue DECIMAL(12,2) DEFAULT 0,
        net_profit DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS voyage_calc_legs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID NOT NULL REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        leg_order INTEGER NOT NULL,
        from_port VARCHAR(255) NOT NULL,
        to_port VARCHAR(255) NOT NULL,
        distance_nm DECIMAL(10,2) NOT NULL,
        condition VARCHAR(50) NOT NULL,
        sea_days DECIMAL(10,2),
        fo_consumption DECIMAL(10,2),
        mgo_consumption DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS voyage_calc_costs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID NOT NULL REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS voyage_calc_revenues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID NOT NULL REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_voyage_calculations_user ON voyage_calculations(user_id);
      CREATE INDEX IF NOT EXISTS idx_voyage_calc_legs_calculation ON voyage_calc_legs(calculation_id);
      CREATE INDEX IF NOT EXISTS idx_voyage_calc_costs_calculation ON voyage_calc_costs(calculation_id);
      CREATE INDEX IF NOT EXISTS idx_voyage_calc_revenues_calculation ON voyage_calc_revenues(calculation_id);
    `

    await sql.unsafe(sqlScript)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Sefer hesaplayıcı ilk kurulum")
  }
}
