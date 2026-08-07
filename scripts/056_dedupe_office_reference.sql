-- Office PnL referans tablolarındaki (fee codes, payee banks) yinelenen
-- kayıtları temizler ve bir daha oluşmaması için benzersizlik kısıtı ekler.
--
-- Sebep: 048 numaralı migration bu tablolara varsayılan değerleri
-- "ON CONFLICT DO NOTHING" ile ekliyordu, ama name sütununda benzersizlik
-- kısıtı olmadığı için ON CONFLICT hiçbir şeyi engellemiyordu. Migration her
-- çalıştırıldığında aynı satırlar yeniden eklenip listede çok kez görünüyordu.

-- 1) Yinelenenleri temizle: her ad için en eski kaydı tut, gerisini sil.
--    Silinen kopyalara bağlı kayıtlar (office_pnl.fee_code_id) korunacak
--    şekilde önce tutulan kayda yönlendirilir.
DO $$
DECLARE
  keep RECORD;
BEGIN
  FOR keep IN
    SELECT name, MIN(created_at) AS first_created
    FROM office_fee_codes
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    -- office_pnl referanslarını tutulacak kayda taşı
    UPDATE office_pnl SET fee_code_id = (
      SELECT id FROM office_fee_codes
      WHERE name = keep.name AND created_at = keep.first_created
      LIMIT 1
    )
    WHERE fee_code_id IN (
      SELECT id FROM office_fee_codes
      WHERE name = keep.name AND created_at <> keep.first_created
    );

    -- fazlalıkları sil
    DELETE FROM office_fee_codes
    WHERE name = keep.name AND created_at <> keep.first_created;
  END LOOP;
END $$;

DO $$
DECLARE
  keep RECORD;
BEGIN
  FOR keep IN
    SELECT name, MIN(created_at) AS first_created
    FROM office_payee_banks
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    DELETE FROM office_payee_banks
    WHERE name = keep.name AND created_at <> keep.first_created;
  END LOOP;
END $$;

-- 2) Benzersizlik kısıtlarını ekle (yoksa). Artık aynı ad tekrar eklenemez.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'office_fee_codes_name_key'
  ) THEN
    ALTER TABLE office_fee_codes ADD CONSTRAINT office_fee_codes_name_key UNIQUE (name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'office_payee_banks_name_key'
  ) THEN
    ALTER TABLE office_payee_banks ADD CONSTRAINT office_payee_banks_name_key UNIQUE (name);
  END IF;
END $$;
