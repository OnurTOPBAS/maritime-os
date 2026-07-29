-- Add new columns to invoices table for enhanced freight management
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) CHECK (invoice_type IN ('freight', 'awrp', 'demurrage', 'other')),
ADD COLUMN IF NOT EXISTS ship_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS charterer VARCHAR(255),
ADD COLUMN IF NOT EXISTS freight_gross_usd DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS freight_net_usd DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS usd_aed_rate DECIMAL(10, 4) DEFAULT 3.6725,
ADD COLUMN IF NOT EXISTS freight_net_aed DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS broker_commission DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS broker_commission_status VARCHAR(20) DEFAULT 'pending' CHECK (broker_commission_status IN ('pending', 'received', 'overdue'));

-- Add index for invoice_type
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);

-- Add index for broker_commission_status
CREATE INDEX IF NOT EXISTS idx_invoices_broker_commission_status ON invoices(broker_commission_status);

-- Update existing invoices to have default values
UPDATE invoices SET usd_aed_rate = 3.6725 WHERE usd_aed_rate IS NULL;
UPDATE invoices SET broker_commission_status = 'pending' WHERE broker_commission_status IS NULL;
