-- ============================================================================
-- Slug'ı olmayan rollerin onarımı
-- ============================================================================
--
-- SORUN: Rol oluşturma uç noktası slug üretmiyordu. Slug olmadan rol,
--   atanabilir roller listesinde görünmüyor (liste slug'a göre filtreler) ve
--   yetki eşlemesi kurulamıyordu. Yani arayüzden oluşturulan her yeni rol
--   sessizce kullanılamaz haldeydi.
--
-- Uygulama tarafı düzeltildi (app/api/roles/route.ts artık slug üretir);
-- bu betik daha önce oluşturulmuş kayıtları onarır.
--
-- Slug üretimi: Türkçe karakterler sadeleştirilir, küçük harfe çevrilir,
-- harf/rakam dışındaki karakterler alt çizgi olur.
-- ============================================================================

UPDATE roles
SET slug = left(
  regexp_replace(
    regexp_replace(
      lower(
        translate(name,
          'çÇğĞıIİiöÖşŞüÜ',
          'ccggiiiioossuu')
      ),
      '[^a-z0-9]+', '_', 'g'
    ),
    '^_|_$', '', 'g'
  ),
  50
)
WHERE slug IS NULL OR trim(slug) = '';

-- Aynı slug'a düşen kayıtlar olursa (ör. "Rol A" ve "Rol-A") sona sıra
-- numarası eklenerek benzersizlik sağlanır.
WITH numaralanmis AS (
  SELECT id, slug,
         row_number() OVER (PARTITION BY slug ORDER BY created_at, id) AS sira
  FROM roles
  WHERE slug IS NOT NULL
)
UPDATE roles r
SET slug = left(n.slug, 46) || '_' || n.sira
FROM numaralanmis n
WHERE r.id = n.id AND n.sira > 1;

-- Boş kalan bir kayıt varsa (adı tamamen sembollerden oluşuyorsa) yedek ad
UPDATE roles
SET slug = 'rol_' || left(replace(id::text, '-', ''), 8)
WHERE slug IS NULL OR trim(slug) = '';
