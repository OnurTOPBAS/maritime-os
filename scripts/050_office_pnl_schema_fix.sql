-- Fix office_pnl monthly tables schema

-- Add status column to office_monthly_reports
ALTER TABLE office_monthly_reports ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';

-- Add created_by to office_monthly_reports (if missing)
ALTER TABLE office_monthly_reports ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Rename balance columns in office_bank_balances for API compatibility
ALTER TABLE office_bank_balances ADD COLUMN IF NOT EXISTS balance_tl DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE office_bank_balances ADD COLUMN IF NOT EXISTS balance_usd DECIMAL(15, 2) DEFAULT 0;

-- Copy data from old columns if they exist
UPDATE office_bank_balances SET balance_tl = COALESCE(closing_balance_tl, 0) WHERE balance_tl = 0 OR balance_tl IS NULL;
UPDATE office_bank_balances SET balance_usd = COALESCE(closing_balance_usd, 0) WHERE balance_usd = 0 OR balance_usd IS NULL;
