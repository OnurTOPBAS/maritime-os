-- PSC (Port State Control) and Vetting Preparation System

-- PSC Inspection Checklist Items
CREATE TABLE IF NOT EXISTS psc_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  regulatory_reference VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PSC Inspection Records
CREATE TABLE IF NOT EXISTS psc_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  port VARCHAR(255),
  country VARCHAR(100),
  inspection_type VARCHAR(100), -- 'Initial', 'More Detailed', 'Expanded'
  inspector_name VARCHAR(255),
  deficiencies_count INTEGER DEFAULT 0,
  detainable_deficiencies INTEGER DEFAULT 0,
  detention BOOLEAN DEFAULT false,
  detention_days INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PSC Deficiencies
CREATE TABLE IF NOT EXISTS psc_deficiencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES psc_inspections(id) ON DELETE CASCADE,
  deficiency_code VARCHAR(50),
  description TEXT NOT NULL,
  action_taken TEXT,
  is_detainable BOOLEAN DEFAULT false,
  rectified BOOLEAN DEFAULT false,
  rectified_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ship Preparation Checklist (for PSC/Vetting)
CREATE TABLE IF NOT EXISTS ship_preparation_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES psc_checklist_items(id),
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES users(id),
  completed_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ship_id, checklist_item_id)
);

-- Vetting Inspections (SIRE, CDI, RIGHTSHIP)
CREATE TABLE IF NOT EXISTS vetting_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  vetting_type VARCHAR(50) NOT NULL, -- 'SIRE', 'CDI', 'RIGHTSHIP', 'Other'
  inspection_date DATE NOT NULL,
  port VARCHAR(255),
  inspector_company VARCHAR(255),
  inspector_name VARCHAR(255),
  observations_count INTEGER DEFAULT 0,
  score DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'completed',
  report_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vetting Observations
CREATE TABLE IF NOT EXISTS vetting_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES vetting_inspections(id) ON DELETE CASCADE,
  category VARCHAR(100),
  observation TEXT NOT NULL,
  action_taken TEXT,
  is_closed BOOLEAN DEFAULT false,
  closed_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_psc_inspections_ship ON psc_inspections(ship_id);
CREATE INDEX IF NOT EXISTS idx_psc_inspections_date ON psc_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_psc_deficiencies_inspection ON psc_deficiencies(inspection_id);
CREATE INDEX IF NOT EXISTS idx_ship_preparation_checklist_ship ON ship_preparation_checklist(ship_id);
CREATE INDEX IF NOT EXISTS idx_vetting_inspections_ship ON vetting_inspections(ship_id);
CREATE INDEX IF NOT EXISTS idx_vetting_inspections_date ON vetting_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_vetting_observations_inspection ON vetting_observations(inspection_id);

-- Seed PSC Checklist Items
INSERT INTO psc_checklist_items (category, item_name, description, regulatory_reference, priority, sort_order) VALUES
-- Certificates
('Certificates', 'Safety Equipment Certificate', 'Check validity and endorsements', 'SOLAS Chapter I', 'high', 1),
('Certificates', 'Safety Radio Certificate', 'Check validity and endorsements', 'SOLAS Chapter IV', 'high', 2),
('Certificates', 'Safety Construction Certificate', 'Check validity and endorsements', 'SOLAS Chapter II-1', 'high', 3),
('Certificates', 'Load Line Certificate', 'Check validity and endorsements', 'ICLL 1966', 'high', 4),
('Certificates', 'IOPPC Certificate', 'Check validity and endorsements', 'MARPOL Annex I', 'high', 5),
('Certificates', 'ISM Certificates (SMC & DOC)', 'Check validity of both certificates', 'ISM Code', 'high', 6),
('Certificates', 'ISSC Certificate', 'Check validity and endorsements', 'ISPS Code', 'high', 7),
('Certificates', 'MLC Certificate', 'Check validity and DMLC Part I & II', 'MLC 2006', 'high', 8),

-- Documentation
('Documentation', 'Crew List', 'Updated crew list with proper endorsements', 'SOLAS', 'high', 10),
('Documentation', 'Minimum Safe Manning Document', 'Check compliance with actual crew', 'SOLAS', 'high', 11),
('Documentation', 'Oil Record Book', 'Check entries and signatures', 'MARPOL Annex I', 'high', 12),
('Documentation', 'Garbage Record Book', 'Check entries and compliance', 'MARPOL Annex V', 'medium', 13),
('Documentation', 'Stability Information', 'Approved stability booklet available', 'SOLAS', 'high', 14),
('Documentation', 'Cargo Securing Manual', 'Approved manual available', 'SOLAS', 'medium', 15),

-- Safety Equipment
('Safety Equipment', 'Life Saving Appliances', 'Lifeboats, life rafts, life jackets', 'SOLAS Chapter III', 'high', 20),
('Safety Equipment', 'Fire Fighting Equipment', 'Fire extinguishers, fire hoses, breathing apparatus', 'SOLAS Chapter II-2', 'high', 21),
('Safety Equipment', 'Navigation Equipment', 'Radar, GPS, ECDIS, gyro compass', 'SOLAS Chapter V', 'high', 22),
('Safety Equipment', 'Radio Equipment', 'VHF, MF/HF, EPIRB, SART', 'SOLAS Chapter IV', 'high', 23),
('Safety Equipment', 'Emergency Equipment', 'Emergency generator, emergency lighting', 'SOLAS', 'high', 24),

-- Operational
('Operational', 'Bridge Procedures', 'Passage planning, watchkeeping', 'STCW', 'high', 30),
('Operational', 'Engine Room', 'Machinery maintenance, oil record book', 'MARPOL', 'medium', 31),
('Operational', 'Cargo Operations', 'Cargo securing, loading procedures', 'SOLAS', 'medium', 32),
('Operational', 'Pollution Prevention', 'SOPEP, oil discharge monitoring', 'MARPOL', 'high', 33),
('Operational', 'Security Procedures', 'SSP implementation, security drills', 'ISPS Code', 'high', 34),

-- Crew
('Crew', 'Certificates of Competency', 'Valid certificates for all crew', 'STCW', 'high', 40),
('Crew', 'Medical Certificates', 'Valid medical certificates', 'MLC 2006', 'high', 41),
('Crew', 'Training Records', 'STCW training certificates', 'STCW', 'medium', 42),
('Crew', 'Rest Hours', 'Compliance with rest hour requirements', 'MLC 2006', 'high', 43),
('Crew', 'Crew Welfare', 'Accommodation, food, recreational facilities', 'MLC 2006', 'medium', 44),

-- Structural
('Structural', 'Hull Condition', 'No excessive corrosion or damage', 'SOLAS', 'high', 50),
('Structural', 'Watertight Doors', 'Operational and properly maintained', 'SOLAS', 'high', 51),
('Structural', 'Deck Machinery', 'Windlass, mooring equipment', 'SOLAS', 'medium', 52),
('Structural', 'Cargo Holds', 'Condition of holds and hatch covers', 'SOLAS', 'medium', 53)

ON CONFLICT DO NOTHING;
