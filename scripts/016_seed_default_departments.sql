-- Seed default departments for all existing companies
-- This will create Finance, Chartering, Operation, and Managers departments

-- Güvenlik ağı: aşağıdaki ON CONFLICT için (company_id, name) benzersizlik
-- kısıtı gereklidir. Tablo eski bir sürümde bu kısıt olmadan oluşturulmuşsa
-- burada eklenir. (Temiz kurulumda 014 zaten ekler; bu yalnızca idempotentlik
-- için.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'departments_company_id_name_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'departments' AND indexdef ILIKE '%UNIQUE%(company_id, name)%'
  ) THEN
    BEGIN
      ALTER TABLE departments ADD CONSTRAINT departments_company_id_name_key UNIQUE (company_id, name);
    EXCEPTION WHEN duplicate_table THEN
      NULL; -- başka bir adla zaten varsa geç
    END;
  END IF;
END $$;

DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM companies LOOP
    -- Insert default departments if they don't exist
    INSERT INTO departments (company_id, name, description)
    VALUES 
      (company_record.id, 'Finance', 'Finans ve muhasebe departmanı')
    ON CONFLICT (company_id, name) DO NOTHING;
    
    INSERT INTO departments (company_id, name, description)
    VALUES 
      (company_record.id, 'Chartering', 'Navlun ve charter işlemleri departmanı')
    ON CONFLICT (company_id, name) DO NOTHING;
    
    INSERT INTO departments (company_id, name, description)
    VALUES 
      (company_record.id, 'Operation', 'Operasyon ve lojistik departmanı')
    ON CONFLICT (company_id, name) DO NOTHING;
    
    INSERT INTO departments (company_id, name, description)
    VALUES 
      (company_record.id, 'Managers', 'Yönetim departmanı')
    ON CONFLICT (company_id, name) DO NOTHING;
  END LOOP;
END $$;
