-- Add new columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ship_name VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS charterer VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS freight_gross_usd DECIMAL(15, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS freight_net_usd DECIMAL(15, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS usd_aed_rate DECIMAL(10, 4) DEFAULT 3.6725;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS freight_net_aed DECIMAL(15, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS broker_commission DECIMAL(15, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS broker_commission_status VARCHAR(20) DEFAULT 'pending';

-- Add check constraint for invoice_type
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_type_check 
  CHECK (invoice_type IS NULL OR invoice_type IN ('freight', 'demurrage', 'awrp', 'commission', 'other'));

-- Add check constraint for broker_commission_status
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_broker_commission_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_broker_commission_status_check 
  CHECK (broker_commission_status IN ('pending', 'paid', 'overdue', 'cancelled'));

-- Create index for invoice_type
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);
