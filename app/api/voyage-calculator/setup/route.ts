import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import { requireSystemAdmin } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

export async function POST() {
  try {
    // Bu uç nokta veritabanı şeması oluşturur (DDL). Önceden kimlik
    // doğrulaması yoktu: internetteki herkes çağırabiliyordu.
    // Şema normalde scripts/ altındaki migration'larla yönetilir.
    const user = await requireAuth()
    await requireSystemAdmin(user.id)


    // Execute each CREATE TABLE statement separately
    const statements = [
      // Main calculations table
      `CREATE TABLE IF NOT EXISTS voyage_calculations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_number VARCHAR(50) UNIQUE NOT NULL,
        ship_id INTEGER REFERENCES ships(id) ON DELETE SET NULL,
        ship_name VARCHAR(255),
        charterer_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
        charterer_name VARCHAR(255),
        service_speed DECIMAL(5,2),
        daily_running_cost DECIMAL(12,2),
        total_distance_nm DECIMAL(10,2) DEFAULT 0,
        total_sea_days DECIMAL(10,2) DEFAULT 0,
        total_port_days DECIMAL(10,2) DEFAULT 0,
        total_days DECIMAL(10,2) DEFAULT 0,
        total_fo_consumption DECIMAL(10,2) DEFAULT 0,
        total_mgo_consumption DECIMAL(10,2) DEFAULT 0,
        total_fuel_cost DECIMAL(12,2) DEFAULT 0,
        total_running_cost DECIMAL(12,2) DEFAULT 0,
        total_other_costs DECIMAL(12,2) DEFAULT 0,
        total_cost DECIMAL(12,2) DEFAULT 0,
        total_revenue DECIMAL(12,2) DEFAULT 0,
        net_profit DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE
      )`,

      // Route legs table
      `CREATE TABLE IF NOT EXISTS voyage_calc_legs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        leg_order INTEGER NOT NULL,
        from_port VARCHAR(255) NOT NULL,
        to_port VARCHAR(255) NOT NULL,
        distance_nm DECIMAL(10,2) NOT NULL,
        leg_condition VARCHAR(20) NOT NULL,
        sea_days DECIMAL(10,2),
        fo_consumption DECIMAL(10,2),
        mgo_consumption DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(calculation_id, leg_order)
      )`,

      // Operations table
      `CREATE TABLE IF NOT EXISTS voyage_calc_operations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        port_name VARCHAR(255) NOT NULL,
        operation_type VARCHAR(50) NOT NULL,
        days DECIMAL(10,2) NOT NULL,
        fo_consumption DECIMAL(10,2) DEFAULT 0,
        mgo_consumption DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Fuel prices table
      `CREATE TABLE IF NOT EXISTS voyage_calc_fuel_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        fo_price DECIMAL(10,2) NOT NULL,
        mgo_price DECIMAL(10,2) NOT NULL,
        notes VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Costs table
      `CREATE TABLE IF NOT EXISTS voyage_calc_costs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Revenues table
      `CREATE TABLE IF NOT EXISTS voyage_calc_revenues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        calculation_id UUID REFERENCES voyage_calculations(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_voyage_calculations_company ON voyage_calculations(company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_voyage_calculations_ship ON voyage_calculations(ship_id)`,
      `CREATE INDEX IF NOT EXISTS idx_voyage_calculations_status ON voyage_calculations(status)`,
      `CREATE INDEX IF NOT EXISTS idx_voyage_calc_legs_calculation ON voyage_calc_legs(calculation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_voyage_calc_operations_calculation ON voyage_calc_operations(calculation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_voyage_calc_fuel_prices_calculation ON voyage_calc_fuel_prices(calculation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_voyage_calc_costs_calculation ON voyage_calc_costs(calculation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_voyage_calc_revenues_calculation ON voyage_calc_revenues(calculation_id)`,
    ]

    // Execute each statement
    for (const statement of statements) {
      await sql.unsafe(statement)
    }


    return NextResponse.json({
      success: true,
      message: "Voyage calculator tables created successfully",
    })
  } catch (error) {
    return handleApiError(error, "Sefer hesaplayıcı kurulumu")
  }
}
