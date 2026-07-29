-- Office PnL Monthly Reports
-- Aylık rapor sistemi ve banka bakiyeleri

-- Office PnL tablosuna report_month kolonu ekle (YYYY-MM formatında)
ALTER TABLE office_pnl ADD COLUMN IF NOT EXISTS report_month VARCHAR(7);

-- Mevcut kayıtlar için report_month'u invoice_date'den çıkar
UPDATE office_pnl 
SET report_month = TO_CHAR(invoice_date, 'YYYY-MM')
WHERE report_month IS NULL AND invoice_date IS NOT NULL;

-- Banka/Kasa Bakiye tablosu
CREATE TABLE IF NOT EXISTS office_bank_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES office_payee_banks(id),
  bank_name VARCHAR(100), -- Cash için veya custom bank
  report_month VARCHAR(7) NOT NULL, -- YYYY-MM formatında
  opening_balance_usd DECIMAL(15, 2) DEFAULT 0, -- Ay başı bakiye USD
  opening_balance_tl DECIMAL(15, 2) DEFAULT 0, -- Ay başı bakiye TL
  closing_balance_usd DECIMAL(15, 2) DEFAULT 0, -- Ay sonu bakiye USD
  closing_balance_tl DECIMAL(15, 2) DEFAULT 0, -- Ay sonu bakiye TL
  currency_rate DECIMAL(10, 4), -- Ay sonu kur
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bank_id, report_month)
);

-- Aylık rapor özeti tablosu (önbellek amaçlı)
CREATE TABLE IF NOT EXISTS office_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month VARCHAR(7) NOT NULL UNIQUE, -- YYYY-MM formatında
  total_income_usd DECIMAL(15, 2) DEFAULT 0,
  total_expense_usd DECIMAL(15, 2) DEFAULT 0,
  total_income_tl DECIMAL(15, 2) DEFAULT 0,
  total_expense_tl DECIMAL(15, 2) DEFAULT 0,
  net_balance_usd DECIMAL(15, 2) DEFAULT 0,
  net_balance_tl DECIMAL(15, 2) DEFAULT 0,
  is_closed BOOLEAN DEFAULT false, -- Ay kapatıldı mı
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_office_pnl_report_month ON office_pnl(report_month);
CREATE INDEX IF NOT EXISTS idx_office_bank_balances_month ON office_bank_balances(report_month);
CREATE INDEX IF NOT EXISTS idx_office_monthly_reports_month ON office_monthly_reports(report_month);
