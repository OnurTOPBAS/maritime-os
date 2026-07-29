-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
  voyage_id UUID REFERENCES voyages(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_fixture ON invoices(fixture_id);
CREATE INDEX idx_invoices_voyage ON invoices(voyage_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- Add unique constraint for invoice number per company
CREATE UNIQUE INDEX idx_invoices_number_company ON invoices(company_id, invoice_number);
