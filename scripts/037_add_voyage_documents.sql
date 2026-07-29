-- Add voyage_id to documents table for voyage-specific documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS voyage_id UUID REFERENCES voyages(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_voyage_id ON documents(voyage_id);

-- Add port column to documents for port-specific categorization
ALTER TABLE documents ADD COLUMN IF NOT EXISTS port VARCHAR(255);

-- Add document_date column for better organization
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_date DATE;
