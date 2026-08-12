-- PSC kontrol listesi maddelerindeki (psc_checklist_items) yinelenen kayıtları
-- temizler ve bir daha oluşmaması için benzersizlik kısıtı ekler.
--
-- Sebep: 042 numaralı migration varsayılan maddeleri "ON CONFLICT DO NOTHING"
-- ile ekliyordu, ama (category, item_name) üzerinde benzersizlik kısıtı
-- olmadığından ON CONFLICT hiçbir şeyi engellemiyordu. Migration her
-- çalıştırıldığında ~53 madde yeniden eklenip listede defalarca görünüyordu.
-- (048/056 ile aynı sınıf hata.)

-- 1) Yinelenenleri temizle: her (category, item_name) için en düşük sort_order
--    + en eski kaydı tut. Gemi hazırlık kontrol kayıtlarını (ship_preparation_
--    checklist) korunan maddeye taşı, sonra fazlalıkları sil.
DO $$
DECLARE
  keep RECORD;
  keep_id UUID;
BEGIN
  FOR keep IN
    SELECT category, item_name
    FROM psc_checklist_items
    GROUP BY category, item_name
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM psc_checklist_items
    WHERE category = keep.category AND item_name = keep.item_name
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;

    -- Bağlı gemi kayıtlarını korunan maddeye yönlendir.
    -- UNIQUE(ship_id, checklist_item_id) çakışmasını önlemek için, aynı gemide
    -- korunan maddeye zaten kayıt varsa yinelenene bağlı olanı sil.
    DELETE FROM ship_preparation_checklist spc
    WHERE spc.checklist_item_id IN (
      SELECT id FROM psc_checklist_items
      WHERE category = keep.category AND item_name = keep.item_name AND id <> keep_id
    )
    AND EXISTS (
      SELECT 1 FROM ship_preparation_checklist s2
      WHERE s2.ship_id = spc.ship_id AND s2.checklist_item_id = keep_id
    );

    UPDATE ship_preparation_checklist
    SET checklist_item_id = keep_id
    WHERE checklist_item_id IN (
      SELECT id FROM psc_checklist_items
      WHERE category = keep.category AND item_name = keep.item_name AND id <> keep_id
    );

    DELETE FROM psc_checklist_items
    WHERE category = keep.category AND item_name = keep.item_name AND id <> keep_id;
  END LOOP;
END $$;

-- 2) Benzersizlik kısıtını ekle (yoksa).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'psc_checklist_items_category_item_key'
  ) THEN
    ALTER TABLE psc_checklist_items
      ADD CONSTRAINT psc_checklist_items_category_item_key UNIQUE (category, item_name);
  END IF;
END $$;
