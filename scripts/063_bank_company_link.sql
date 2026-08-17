-- Banka/kasa hesaplarını bir şirkete bağlar. Böylece kasa/bakiye ve gider
-- kayıtları şirket bazında ayrılır; bir şirketin kullanıcısı yalnızca kendi
-- şirketinin hesaplarını ve bakiyelerini görür.
--
-- company_id NULL = eski/paylaşılan hesap (yalnızca süper yönetici görür).

ALTER TABLE office_payee_banks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_office_payee_banks_company ON office_payee_banks(company_id);
