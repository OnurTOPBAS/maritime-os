-- ports tablosundaki yinelenen liman kayıtlarını temizler ve unlocode üzerinde
-- benzersizlik kısıtı ekler.
--
-- Sebep: 037 numaralı migration varsayılan limanları hiçbir ON CONFLICT olmadan
-- ekliyordu; unlocode benzersiz olmadığı için migration her çalıştığında 44
-- liman yeniden ekleniyor, seçim listelerinde defalarca görünüyordu.
-- (048/056, 042/057 ile aynı sınıf hata.)

-- 1) Yinelenenleri temizle: her unlocode için en eski kaydı tut.
DELETE FROM ports p
USING (
  SELECT unlocode, MIN(ctid) AS keep_ctid
  FROM ports
  WHERE unlocode IS NOT NULL
  GROUP BY unlocode
  HAVING COUNT(*) > 1
) d
WHERE p.unlocode = d.unlocode
  AND p.ctid <> d.keep_ctid;

-- 2) unlocode'a benzersizlik kısıtı ekle (yoksa).
--    (NULL unlocode'lar birden fazla olabilir; Postgres NULL'ları çakıştırmaz.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ports_unlocode_key'
  ) THEN
    ALTER TABLE ports ADD CONSTRAINT ports_unlocode_key UNIQUE (unlocode);
  END IF;
END $$;
