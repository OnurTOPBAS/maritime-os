-- Ship Certificates Table
CREATE TABLE IF NOT EXISTS ship_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  certificate_name VARCHAR(255) NOT NULL,
  certificate_type VARCHAR(100),
  issued_date DATE,
  last_annual_date DATE,
  last_intermediate_date DATE,
  expires_date DATE,
  issuing_authority VARCHAR(255),
  certificate_number VARCHAR(100),
  file_url TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'valid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_ship_certificates_ship ON ship_certificates(ship_id);
CREATE INDEX idx_ship_certificates_expires ON ship_certificates(expires_date);
CREATE INDEX idx_ship_certificates_status ON ship_certificates(status);

-- Add some default certificate types as a reference
COMMENT ON COLUMN ship_certificates.certificate_type IS 'Types: SEC, SRC, SCC, ILC, IOPPC, ISSC, MLC, SMC, DOC, USCGCOC, CLC, CLBC, WRC, COFR, COC, ISPPC, COF, IEEC, IAPPC';
