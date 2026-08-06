-- Add support for multiple files per certificate
CREATE TABLE IF NOT EXISTS ship_certificate_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES ship_certificates(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  thumbnail_url TEXT,
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificate_files_certificate ON ship_certificate_files(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_files_current ON ship_certificate_files(certificate_id, is_current);
