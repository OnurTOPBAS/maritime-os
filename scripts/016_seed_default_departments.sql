-- Seed default departments for all existing companies
-- This will create Finance, Chartering, Operation, and Managers departments

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
