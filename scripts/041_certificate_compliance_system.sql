-- Certificate Compliance System
-- Defines which certificates are required for each vessel type

-- Certificate requirements by vessel type
CREATE TABLE IF NOT EXISTS certificate_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vessel_type VARCHAR(100) NOT NULL,
  certificate_type VARCHAR(100) NOT NULL,
  certificate_name VARCHAR(255) NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  renewal_period_months INTEGER,
  warning_days_before_expiry INTEGER DEFAULT 90,
  critical_days_before_expiry INTEGER DEFAULT 30,
  description TEXT,
  regulatory_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vessel_type, certificate_type)
);

-- Certificate audit log for tracking changes
CREATE TABLE IF NOT EXISTS certificate_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES ship_certificates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'renewed'
  changes JSONB, -- Store what changed
  previous_values JSONB, -- Store previous values
  new_values JSONB, -- Store new values
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificate versions for tracking history
CREATE TABLE IF NOT EXISTS certificate_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES ship_certificates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  certificate_name VARCHAR(255) NOT NULL,
  certificate_type VARCHAR(100),
  issued_date DATE,
  expires_date DATE,
  issuing_authority VARCHAR(255),
  certificate_number VARCHAR(100),
  file_url TEXT,
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add responsible person and notification fields to ship_certificates if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='ship_certificates' AND column_name='responsible_person') THEN
    ALTER TABLE ship_certificates ADD COLUMN responsible_person VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='ship_certificates' AND column_name='notify_30_days') THEN
    ALTER TABLE ship_certificates ADD COLUMN notify_30_days BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='ship_certificates' AND column_name='notify_60_days') THEN
    ALTER TABLE ship_certificates ADD COLUMN notify_60_days BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='ship_certificates' AND column_name='notify_90_days') THEN
    ALTER TABLE ship_certificates ADD COLUMN notify_90_days BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_certificate_requirements_vessel_type ON certificate_requirements(vessel_type);
CREATE INDEX IF NOT EXISTS idx_certificate_audit_log_certificate ON certificate_audit_log(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_audit_log_user ON certificate_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_certificate_versions_certificate ON certificate_versions(certificate_id);

-- Seed default certificate requirements for common vessel types
INSERT INTO certificate_requirements (vessel_type, certificate_type, certificate_name, is_mandatory, renewal_period_months, description, regulatory_reference) VALUES
-- Bulk Carrier
('Bulk Carrier', 'SEC', 'Safety Equipment Certificate', true, 12, 'Certificate for safety equipment', 'SOLAS Chapter I'),
('Bulk Carrier', 'SRC', 'Safety Radio Certificate', true, 12, 'Certificate for radio equipment', 'SOLAS Chapter IV'),
('Bulk Carrier', 'SCC', 'Safety Construction Certificate', true, 60, 'Certificate for ship construction', 'SOLAS Chapter II-1'),
('Bulk Carrier', 'ILC', 'International Load Line Certificate', true, 60, 'Load line certificate', 'ICLL 1966'),
('Bulk Carrier', 'IOPPC', 'International Oil Pollution Prevention Certificate', true, 60, 'Oil pollution prevention', 'MARPOL Annex I'),
('Bulk Carrier', 'ISSC', 'International Ship Security Certificate', true, 60, 'Ship security certificate', 'ISPS Code'),
('Bulk Carrier', 'MLC', 'Maritime Labour Certificate', true, 60, 'Maritime labour compliance', 'MLC 2006'),
('Bulk Carrier', 'SMC', 'Safety Management Certificate', true, 60, 'ISM Code compliance', 'ISM Code'),
('Bulk Carrier', 'DOC', 'Document of Compliance', true, 60, 'Company ISM compliance', 'ISM Code'),
('Bulk Carrier', 'CLC', 'Civil Liability Convention Certificate', true, 12, 'Civil liability insurance', 'CLC 1992'),
('Bulk Carrier', 'CLBC', 'Bunker Convention Certificate', true, 12, 'Bunker oil pollution liability', 'Bunker Convention 2001'),

-- Oil Tanker
('Oil Tanker', 'SEC', 'Safety Equipment Certificate', true, 12, 'Certificate for safety equipment', 'SOLAS Chapter I'),
('Oil Tanker', 'SRC', 'Safety Radio Certificate', true, 12, 'Certificate for radio equipment', 'SOLAS Chapter IV'),
('Oil Tanker', 'SCC', 'Safety Construction Certificate', true, 60, 'Certificate for ship construction', 'SOLAS Chapter II-1'),
('Oil Tanker', 'ILC', 'International Load Line Certificate', true, 60, 'Load line certificate', 'ICLL 1966'),
('Oil Tanker', 'IOPPC', 'International Oil Pollution Prevention Certificate', true, 60, 'Oil pollution prevention', 'MARPOL Annex I'),
('Oil Tanker', 'ISSC', 'International Ship Security Certificate', true, 60, 'Ship security certificate', 'ISPS Code'),
('Oil Tanker', 'MLC', 'Maritime Labour Certificate', true, 60, 'Maritime labour compliance', 'MLC 2006'),
('Oil Tanker', 'SMC', 'Safety Management Certificate', true, 60, 'ISM Code compliance', 'ISM Code'),
('Oil Tanker', 'DOC', 'Document of Compliance', true, 60, 'Company ISM compliance', 'ISM Code'),
('Oil Tanker', 'COF', 'Certificate of Fitness', true, 60, 'Fitness for carriage of dangerous chemicals', 'IBC Code'),
('Oil Tanker', 'CLC', 'Civil Liability Convention Certificate', true, 12, 'Civil liability insurance', 'CLC 1992'),
('Oil Tanker', 'CLBC', 'Bunker Convention Certificate', true, 12, 'Bunker oil pollution liability', 'Bunker Convention 2001'),

-- Container Ship
('Container Ship', 'SEC', 'Safety Equipment Certificate', true, 12, 'Certificate for safety equipment', 'SOLAS Chapter I'),
('Container Ship', 'SRC', 'Safety Radio Certificate', true, 12, 'Certificate for radio equipment', 'SOLAS Chapter IV'),
('Container Ship', 'SCC', 'Safety Construction Certificate', true, 60, 'Certificate for ship construction', 'SOLAS Chapter II-1'),
('Container Ship', 'ILC', 'International Load Line Certificate', true, 60, 'Load line certificate', 'ICLL 1966'),
('Container Ship', 'IOPPC', 'International Oil Pollution Prevention Certificate', true, 60, 'Oil pollution prevention', 'MARPOL Annex I'),
('Container Ship', 'ISSC', 'International Ship Security Certificate', true, 60, 'Ship security certificate', 'ISPS Code'),
('Container Ship', 'MLC', 'Maritime Labour Certificate', true, 60, 'Maritime labour compliance', 'MLC 2006'),
('Container Ship', 'SMC', 'Safety Management Certificate', true, 60, 'ISM Code compliance', 'ISM Code'),
('Container Ship', 'DOC', 'Document of Compliance', true, 60, 'Company ISM compliance', 'ISM Code'),
('Container Ship', 'CLC', 'Civil Liability Convention Certificate', true, 12, 'Civil liability insurance', 'CLC 1992'),
('Container Ship', 'CLBC', 'Bunker Convention Certificate', true, 12, 'Bunker oil pollution liability', 'Bunker Convention 2001'),

-- General Cargo
('General Cargo', 'SEC', 'Safety Equipment Certificate', true, 12, 'Certificate for safety equipment', 'SOLAS Chapter I'),
('General Cargo', 'SRC', 'Safety Radio Certificate', true, 12, 'Certificate for radio equipment', 'SOLAS Chapter IV'),
('General Cargo', 'SCC', 'Safety Construction Certificate', true, 60, 'Certificate for ship construction', 'SOLAS Chapter II-1'),
('General Cargo', 'ILC', 'International Load Line Certificate', true, 60, 'Load line certificate', 'ICLL 1966'),
('General Cargo', 'IOPPC', 'International Oil Pollution Prevention Certificate', true, 60, 'Oil pollution prevention', 'MARPOL Annex I'),
('General Cargo', 'ISSC', 'International Ship Security Certificate', true, 60, 'Ship security certificate', 'ISPS Code'),
('General Cargo', 'MLC', 'Maritime Labour Certificate', true, 60, 'Maritime labour compliance', 'MLC 2006'),
('General Cargo', 'SMC', 'Safety Management Certificate', true, 60, 'ISM Code compliance', 'ISM Code'),
('General Cargo', 'DOC', 'Document of Compliance', true, 60, 'Company ISM compliance', 'ISM Code'),
('General Cargo', 'CLC', 'Civil Liability Convention Certificate', true, 12, 'Civil liability insurance', 'CLC 1992'),
('General Cargo', 'CLBC', 'Bunker Convention Certificate', true, 12, 'Bunker oil pollution liability', 'Bunker Convention 2001')

ON CONFLICT (vessel_type, certificate_type) DO NOTHING;
