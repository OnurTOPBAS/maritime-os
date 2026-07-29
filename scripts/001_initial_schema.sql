-- Maritime Company Management System Database Schema
-- Version: 001 - Initial Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  image TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table (for NextAuth.js OAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  UNIQUE(provider, provider_account_id)
);

-- Sessions table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Verification tokens table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fleets table (Fleet companies under a company)
CREATE TABLE IF NOT EXISTS fleets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ships table
CREATE TABLE IF NOT EXISTS ships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  imo_number VARCHAR(20) UNIQUE,
  flag VARCHAR(100),
  vessel_type VARCHAR(100),
  dwt DECIMAL(10, 2),
  built_year INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fixtures table (Charter agreements)
CREATE TABLE IF NOT EXISTS fixtures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  charterer VARCHAR(255) NOT NULL,
  cargo_type VARCHAR(255),
  rate DECIMAL(12, 2),
  rate_type VARCHAR(50),
  cp_date DATE,
  laycan_from DATE,
  laycan_to DATE,
  load_port VARCHAR(255),
  discharge_port VARCHAR(255),
  demurrage_rate DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_fleets_company ON fleets(company_id);
CREATE INDEX idx_ships_fleet ON ships(fleet_id);
CREATE INDEX idx_fixtures_ship ON fixtures(ship_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
