-- Office PnL (Profit and Loss) Module
-- Ofis tarafında gelir ve giderlerin yönetimi

-- Fee Code tablosu - önceden tanımlı ve kullanıcı tanımlı fee türleri
CREATE TABLE IF NOT EXISTS office_fee_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  is_system BOOLEAN DEFAULT false, -- Sistem tarafından tanımlanan varsayılan türler
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan fee code'ları ekle
INSERT INTO office_fee_codes (name, is_system) VALUES
  ('Subscriptions', true),
  ('Gov. Taxes', true),
  ('Wages', true),
  ('Various', true)
ON CONFLICT DO NOTHING;

-- Payee Bank tablosu - ödeme yapılan bankalar
CREATE TABLE IF NOT EXISTS office_payee_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan bankaları ekle
INSERT INTO office_payee_banks (name, is_system) VALUES
  ('Cash', true),
  ('Ziraat', true),
  ('Vakıf Katılım', true),
  ('Garanti', true),
  ('İş Bankası', true)
ON CONFLICT DO NOTHING;

-- Ana Office PnL tablosu
CREATE TABLE IF NOT EXISTS office_pnl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fee Code - kategori
  fee_code_id UUID REFERENCES office_fee_codes(id),
  fee_code_custom VARCHAR(100), -- Manuel girilen fee code
  
  -- Şirket bilgisi
  company_id UUID REFERENCES companies(id),
  company_name VARCHAR(255), -- Denormalize for quick access
  
  -- Ödeme yapılan firma
  payee VARCHAR(255) NOT NULL,
  
  -- Açıklama
  description TEXT,
  
  -- Fatura bilgileri
  invoice_date DATE,
  invoice_no VARCHAR(100),
  
  -- Tutar bilgileri
  price_tl DECIMAL(15, 2),
  price_usd DECIMAL(15, 2),
  currency_rate DECIMAL(10, 4), -- USD/TL kuru
  
  -- Ödeme durumu
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'cancel')),
  
  -- Ödeme yapılan banka
  payee_bank_id UUID REFERENCES office_payee_banks(id),
  payee_bank_custom VARCHAR(100), -- Manuel girilen banka
  
  -- Ödeme tarihi
  payment_date DATE,
  
  -- Tip (gelir/gider)
  type VARCHAR(20) DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  
  -- Notlar
  notes TEXT,
  
  -- Meta
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_office_pnl_company ON office_pnl(company_id);
CREATE INDEX IF NOT EXISTS idx_office_pnl_fee_code ON office_pnl(fee_code_id);
CREATE INDEX IF NOT EXISTS idx_office_pnl_payment_status ON office_pnl(payment_status);
CREATE INDEX IF NOT EXISTS idx_office_pnl_type ON office_pnl(type);
CREATE INDEX IF NOT EXISTS idx_office_pnl_invoice_date ON office_pnl(invoice_date);
CREATE INDEX IF NOT EXISTS idx_office_pnl_payment_date ON office_pnl(payment_date);
