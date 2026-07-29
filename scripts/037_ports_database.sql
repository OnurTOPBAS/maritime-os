-- Create ports table for free port search
CREATE TABLE IF NOT EXISTS ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  port_name VARCHAR(255) NOT NULL,
  country_iso VARCHAR(2),
  country_name VARCHAR(255),
  unlocode VARCHAR(5),
  port_type VARCHAR(50),
  lat DECIMAL(10, 8),
  lon DECIMAL(11, 8),
  area_global VARCHAR(255),
  area_local VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster search
CREATE INDEX IF NOT EXISTS idx_ports_name ON ports(port_name);
CREATE INDEX IF NOT EXISTS idx_ports_unlocode ON ports(unlocode);

-- Insert common Turkish and international ports
INSERT INTO ports (port_name, country_iso, country_name, unlocode, port_type, lat, lon, area_global, area_local) VALUES
-- Turkish Ports
('ISTANBUL', 'TR', 'Turkey', 'TRIST', 'Port', 41.0082, 28.9784, 'Mediterranean & Black Sea', 'Marmara Sea'),
('IZMIR', 'TR', 'Turkey', 'TRIZM', 'Port', 38.4192, 27.1287, 'Mediterranean & Black Sea', 'Aegean Sea'),
('MERSIN', 'TR', 'Turkey', 'TRMER', 'Port', 36.8121, 34.6415, 'Mediterranean & Black Sea', 'Mediterranean'),
('ALIAGA', 'TR', 'Turkey', 'TRALI', 'Port', 38.8000, 26.9667, 'Mediterranean & Black Sea', 'Aegean Sea'),
('GEMLIK', 'TR', 'Turkey', 'TRGEM', 'Port', 40.4333, 29.1667, 'Mediterranean & Black Sea', 'Marmara Sea'),
('ISKENDERUN', 'TR', 'Turkey', 'TRISK', 'Port', 36.5875, 36.1744, 'Mediterranean & Black Sea', 'Mediterranean'),
('SAMSUN', 'TR', 'Turkey', 'TRSAM', 'Port', 41.2867, 36.3300, 'Mediterranean & Black Sea', 'Black Sea'),
('TRABZON', 'TR', 'Turkey', 'TRTZX', 'Port', 41.0015, 39.7178, 'Mediterranean & Black Sea', 'Black Sea'),
('BANDIRMA', 'TR', 'Turkey', 'TRBAN', 'Port', 40.3500, 27.9667, 'Mediterranean & Black Sea', 'Marmara Sea'),
('DERINCE', 'TR', 'Turkey', 'TRDER', 'Port', 40.7667, 29.8333, 'Mediterranean & Black Sea', 'Marmara Sea'),
('ANTALYA', 'TR', 'Turkey', 'TRAYT', 'Port', 36.8969, 30.7133, 'Mediterranean & Black Sea', 'Mediterranean'),
('TEKIRDAG', 'TR', 'Turkey', 'TRTEK', 'Port', 40.9833, 27.5167, 'Mediterranean & Black Sea', 'Marmara Sea'),
('CANAKKALE', 'TR', 'Turkey', 'TRCKA', 'Port', 40.1553, 26.4142, 'Mediterranean & Black Sea', 'Marmara Sea'),
('DORTYOL', 'TR', 'Turkey', 'TRDOR', 'Port', 36.8500, 36.2167, 'Mediterranean & Black Sea', 'Mediterranean'),

-- Major European Ports
('ROTTERDAM', 'NL', 'Netherlands', 'NLRTM', 'Port', 51.9225, 4.4792, 'North Europe', 'North Sea'),
('ANTWERP', 'BE', 'Belgium', 'BEANR', 'Port', 51.2194, 4.4025, 'North Europe', 'North Sea'),
('HAMBURG', 'DE', 'Germany', 'DEHAM', 'Port', 53.5511, 9.9937, 'North Europe', 'North Sea'),
('PIRAEUS', 'GR', 'Greece', 'GRPIR', 'Port', 37.9478, 23.6478, 'Mediterranean & Black Sea', 'Mediterranean'),
('VALENCIA', 'ES', 'Spain', 'ESVLC', 'Port', 39.4699, -0.3763, 'Mediterranean & Black Sea', 'Mediterranean'),
('BARCELONA', 'ES', 'Spain', 'ESBCN', 'Port', 41.3851, 2.1734, 'Mediterranean & Black Sea', 'Mediterranean'),
('GENOA', 'IT', 'Italy', 'ITGOA', 'Port', 44.4056, 8.9463, 'Mediterranean & Black Sea', 'Mediterranean'),
('MARSEILLE', 'FR', 'France', 'FRMRS', 'Port', 43.2965, 5.3698, 'Mediterranean & Black Sea', 'Mediterranean'),
('LE HAVRE', 'FR', 'France', 'FRLEH', 'Port', 49.4944, 0.1079, 'North Europe', 'English Channel'),
('LONDON', 'GB', 'United Kingdom', 'GBLON', 'Port', 51.5074, -0.1278, 'North Europe', 'English Channel'),
('FELIXSTOWE', 'GB', 'United Kingdom', 'GBFXT', 'Port', 51.9642, 1.3515, 'North Europe', 'North Sea'),

-- Mediterranean Ports
('ALEXANDRIA', 'EG', 'Egypt', 'EGALY', 'Port', 31.2001, 29.9187, 'Mediterranean & Black Sea', 'Mediterranean'),
('PORT SAID', 'EG', 'Egypt', 'EGPSD', 'Port', 31.2653, 32.3019, 'Mediterranean & Black Sea', 'Mediterranean'),
('HAIFA', 'IL', 'Israel', 'ILHFA', 'Port', 32.8191, 34.9983, 'Mediterranean & Black Sea', 'Mediterranean'),
('BEIRUT', 'LB', 'Lebanon', 'LBBEY', 'Port', 33.8886, 35.4955, 'Mediterranean & Black Sea', 'Mediterranean'),

-- Black Sea Ports
('CONSTANTA', 'RO', 'Romania', 'ROCND', 'Port', 44.1598, 28.6348, 'Mediterranean & Black Sea', 'Black Sea'),
('ODESSA', 'UA', 'Ukraine', 'UAODS', 'Port', 46.4825, 30.7233, 'Mediterranean & Black Sea', 'Black Sea'),
('NOVOROSSIYSK', 'RU', 'Russia', 'RUNVS', 'Port', 44.7230, 37.7686, 'Mediterranean & Black Sea', 'Black Sea'),

-- Middle East Ports
('JEDDAH', 'SA', 'Saudi Arabia', 'SAJED', 'Port', 21.5433, 39.1728, 'Middle East', 'Red Sea'),
('DUBAI', 'AE', 'United Arab Emirates', 'AEDXB', 'Port', 25.2048, 55.2708, 'Middle East', 'Persian Gulf'),
('ABU DHABI', 'AE', 'United Arab Emirates', 'AEAUH', 'Port', 24.4539, 54.3773, 'Middle East', 'Persian Gulf'),

-- Asian Ports
('SINGAPORE', 'SG', 'Singapore', 'SGSIN', 'Port', 1.3521, 103.8198, 'Far East', 'South China Sea'),
('SHANGHAI', 'CN', 'China', 'CNSHA', 'Port', 31.2304, 121.4737, 'Far East', 'East China Sea'),
('HONG KONG', 'HK', 'Hong Kong', 'HKHKG', 'Port', 22.3193, 114.1694, 'Far East', 'South China Sea'),
('BUSAN', 'KR', 'South Korea', 'KRPUS', 'Port', 35.1796, 129.0756, 'Far East', 'Korea Strait'),
('TOKYO', 'JP', 'Japan', 'JPTYO', 'Port', 35.6762, 139.6503, 'Far East', 'Pacific Ocean'),

-- American Ports
('NEW YORK', 'US', 'United States', 'USNYC', 'Port', 40.7128, -74.0060, 'North America', 'Atlantic Ocean'),
('LOS ANGELES', 'US', 'United States', 'USLAX', 'Port', 33.7701, -118.1937, 'North America', 'Pacific Ocean'),
('HOUSTON', 'US', 'United States', 'USHOU', 'Port', 29.7604, -95.3698, 'North America', 'Gulf of Mexico'),
('SANTOS', 'BR', 'Brazil', 'BRSSZ', 'Port', -23.9608, -46.3336, 'South America', 'Atlantic Ocean');
