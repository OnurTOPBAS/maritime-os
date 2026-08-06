-- Create documents table for file management
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'charter_party', 'certificate', 'invoice', 'other'
  
  -- Relations (at least one must be set)
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
  fixture_id UUID REFERENCES fixtures(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Metadata
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_ship ON documents(ship_id);
CREATE INDEX IF NOT EXISTS idx_documents_fixture ON documents(fixture_id);
CREATE INDEX IF NOT EXISTS idx_documents_invoice ON documents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
