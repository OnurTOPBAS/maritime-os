-- Add banks and accounts for fleets
-- Version: 038

-- Fleet Banks table
CREATE TABLE IF NOT EXISTS fleet_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(50),
  swift_code VARCHAR(20),
  branch_name VARCHAR(255),
  branch_address TEXT,
  relationship_manager_name VARCHAR(255),
  relationship_manager_email VARCHAR(255),
  relationship_manager_phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID NOT NULL REFERENCES fleet_banks(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  iban VARCHAR(50),
  account_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_fleet_banks_fleet ON fleet_banks(fleet_id);
CREATE INDEX idx_bank_accounts_bank ON bank_accounts(bank_id);
