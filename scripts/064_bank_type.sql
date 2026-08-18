-- Banka hesaplarına "banka tipi" ekler (İş Bankası, Garanti, Ziraat, ...).
-- Böylece hesaplar bankaya göre gruplanıp sıralanabilir ve tipe göre
-- rozet/logo gösterilebilir. Mevcut kayıtlar adlarından otomatik doldurulur.

ALTER TABLE office_payee_banks ADD COLUMN IF NOT EXISTS bank_type VARCHAR(30);

-- Addan tip çıkarımı (ILIKE ASCII alt dizeleriyle; Türkçe locale'den bağımsız).
-- Sıra önemli: özel bankalar önce, kalan "bank" geçenler İş Bankası sayılır.
UPDATE office_payee_banks SET bank_type = CASE
  WHEN name ILIKE '%emirates%' OR name ILIKE '%nbd%'          THEN 'emirates_nbd'
  WHEN name ILIKE '%garanti%'                                  THEN 'garanti'
  WHEN name ILIKE '%ziraat%'                                   THEN 'ziraat'
  WHEN name ILIKE '%vakıf%' OR name ILIKE '%vakif%'            THEN 'vakif'
  WHEN name ILIKE '%yapı kredi%' OR name ILIKE '%yapi kredi%'  THEN 'yapikredi'
  WHEN name ILIKE '%kasa%' OR name ILIKE '%cash%' OR name ILIKE '%safe%' THEN 'cash'
  WHEN name ILIKE '%bank%'                                     THEN 'isbank'
  ELSE 'other'
END
WHERE bank_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_office_payee_banks_type ON office_payee_banks(bank_type);
