-- EKSİK TABLO: fuel_records
--
-- app/api/voyages/[id]/fuel/route.ts bu tabloyu sorguluyor ancak hiçbir
-- migration onu oluşturmuyordu; dolayısıyla yakıt takibi özelliği hiç
-- çalışmamıştı. Şema, ilgili rotanın SELECT/INSERT ifadelerinden çıkarıldı.
--
-- 038_update_fuel_records_structure.sql bu tabloya sütun eklemeye çalışır;
-- bu script ondan ÖNCE çalışmalıdır (dosya adı sıralaması gereği 053 olarak
-- eklendi, 038 yeniden çalıştırılırsa artık başarılı olur).

CREATE TABLE IF NOT EXISTS fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,

  port VARCHAR(255),
  fuel_type VARCHAR(50) NOT NULL,

  -- ROB: Remaining On Board (gemide kalan yakıt)
  arrival_rob NUMERIC(12, 3),
  departure_rob NUMERIC(12, 3),
  port_consumption NUMERIC(12, 3),
  sea_consumption NUMERIC(12, 3),

  record_date DATE NOT NULL,
  -- arrival | departure
  leg_type VARCHAR(20),

  price_per_ton NUMERIC(12, 2),
  total_cost NUMERIC(15, 2),

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fuel_records_voyage
  ON fuel_records (voyage_id, record_date, created_at);
