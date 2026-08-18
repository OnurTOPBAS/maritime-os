-- ============================================================================
-- Modül bazlı yetkilendirme (RBAC) sisteminin devreye alınması
-- ============================================================================
--
-- SORUN:
--   Projede iki ayrı rol sistemi vardı.
--     1) lib/authz.ts içinde koda gömülü 3 rol (admin/manager/viewer) ve
--        modülden bağımsız 4 kaba yetki. Erişimi fiilen bu yönetiyordu.
--     2) roles / permissions / role_permissions tabloları. 6 rol ve 20 izin
--        tanımlıydı ancak role_permissions TAMAMEN BOŞTU ve hiçbir kod bu
--        tabloları okumuyordu. "Operations Manager" gibi roller yalnızca
--        isimden ibaretti.
--
-- BU BETİK:
--   - roles tablosuna kod tarafında güvenle kullanılabilecek sabit bir `slug`
--     ekler (kullanıcı rol adını değiştirse bile eşleme bozulmaz).
--   - İzin kataloğunu uygulamanın gerçek modüllerini kapsayacak şekilde
--     genişletir (6 modül -> 16 modül).
--   - Her role modül bazında izinlerini atar.
--
-- Betik idempotenttir; tekrar çalıştırılabilir.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Rollere sabit slug ekle
-- ----------------------------------------------------------------------------
ALTER TABLE roles ADD COLUMN IF NOT EXISTS slug VARCHAR(50);

UPDATE roles SET slug = 'admin'              WHERE lower(name) = 'admin'              AND slug IS NULL;
UPDATE roles SET slug = 'manager'            WHERE lower(name) = 'manager'            AND slug IS NULL;
UPDATE roles SET slug = 'viewer'             WHERE lower(name) = 'viewer'             AND slug IS NULL;
UPDATE roles SET slug = 'operations_manager' WHERE lower(name) = 'operations manager' AND slug IS NULL;
UPDATE roles SET slug = 'technical_manager'  WHERE lower(name) = 'technical manager'  AND slug IS NULL;
UPDATE roles SET slug = 'finance_manager'    WHERE lower(name) = 'finance manager'    AND slug IS NULL;

-- Eksik roller (temiz kurulumda tablo boş olabilir)
INSERT INTO roles (name, description, is_system, slug) VALUES
  ('Admin',              'Tam yetki - tüm modüllere erişim',                    true,  'admin'),
  ('Manager',            'Yönetici - silme dışında geniş yetki',                true,  'manager'),
  ('Viewer',             'Görüntüleyici - yalnızca okuma',                      true,  'viewer'),
  ('Operations Manager', 'Operasyon - gemi, sefer ve fixture yönetimi',         false, 'operations_manager'),
  ('Technical Manager',  'Teknik - gemi, sertifika ve belge yönetimi',          false, 'technical_manager'),
  ('Finance Manager',    'Finans - fatura, ofis P&L ve rapor yönetimi',         false, 'finance_manager')
ON CONFLICT (name) DO UPDATE
  SET slug = COALESCE(roles.slug, EXCLUDED.slug),
      description = EXCLUDED.description;

-- Slug'lar benzersiz olmalı (kod bu alana göre eşleme yapar)
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_slug ON roles (slug) WHERE slug IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2) İzin kataloğunu genişlet
--
-- Modüller uygulamanın gerçek bölümlerine karşılık gelir. Eylemler:
--   view (görüntüle), create (ekle), edit (düzenle), delete (sil)
--   export yalnızca reports modülünde kullanılır.
-- ----------------------------------------------------------------------------
INSERT INTO permissions (module, action, description)
SELECT m.module, a.action,
       m.label || ' - ' ||
       CASE a.action
         WHEN 'view'   THEN 'görüntüleme'
         WHEN 'create' THEN 'ekleme'
         WHEN 'edit'   THEN 'düzenleme'
         WHEN 'delete' THEN 'silme'
       END
FROM (VALUES
  ('ships',             'Gemiler'),
  ('fleets',            'Filolar'),
  ('fixtures',          'Fixture'),
  ('voyages',           'Seferler'),
  ('voyage_account',    'Sefer hesabı'),
  ('voyage_calculator', 'Sefer hesaplayıcı'),
  ('certificates',      'Sertifikalar'),
  ('documents',         'Belgeler'),
  ('invoices',          'Faturalar'),
  ('finance',           'Ofis P&L'),
  ('companies',         'Şirketler'),
  ('users',             'Kullanıcılar'),
  ('tasks',             'Görevler'),
  ('messages',          'Mesajlar')
) AS m(module, label)
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS a(action)
ON CONFLICT (module, action) DO NOTHING;

-- Raporlar ve ayarlar farklı eylem kümesine sahiptir
INSERT INTO permissions (module, action, description) VALUES
  ('reports',  'view',   'Raporlar - görüntüleme'),
  ('reports',  'export', 'Raporlar - dışa aktarma'),
  ('settings', 'view',   'Ayarlar - görüntüleme'),
  ('settings', 'edit',   'Ayarlar - düzenleme')
ON CONFLICT (module, action) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3) Rollere izinleri ata
-- ----------------------------------------------------------------------------

-- Önce sistem rollerinin izinleri sıfırlanır (bu betik tek doğruluk kaynağıdır).
-- Kullanıcının elle oluşturduğu roller (aşağıdaki 6 slug dışındakiler) korunur.
DELETE FROM role_permissions
WHERE role_id IN (
  SELECT id FROM roles
  WHERE slug IN ('admin','manager','viewer','operations_manager','technical_manager','finance_manager')
);

-- Admin: her şey
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Manager: silme ve ayar düzenleme hariç her şey
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'manager'
  AND p.action <> 'delete'
  AND NOT (p.module = 'settings' AND p.action = 'edit')
  AND NOT (p.module = 'users'    AND p.action IN ('create','edit'))
ON CONFLICT DO NOTHING;

-- Viewer: yalnızca görüntüleme
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'viewer' AND p.action = 'view'
ON CONFLICT DO NOTHING;

-- Operations Manager: operasyon modüllerinde tam yetki. Finans (Office PnL)
-- erişimi YOK — operasyon rolü mali veriyi görmez.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'operations_manager'
  AND (
    p.module IN ('ships','fleets','fixtures','voyages','voyage_account',
                 'voyage_calculator','documents','tasks','messages')
    OR (p.module IN ('certificates','invoices','companies','reports') AND p.action IN ('view','export'))
    OR (p.module = 'settings' AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;

-- Technical Manager: gemi/sertifika/belge odaklı; finansa erişimi yok
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'technical_manager'
  AND (
    p.module IN ('ships','certificates','documents','tasks','messages')
    OR (p.module IN ('fleets','fixtures','voyages','companies','reports') AND p.action IN ('view','export'))
    OR (p.module = 'settings' AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;

-- Finance Manager: fatura/P&L/rapor tam yetki; operasyonu yalnızca görüntüler
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'finance_manager'
  AND (
    p.module IN ('invoices','finance','reports','documents','tasks','messages')
    OR (p.module IN ('ships','fleets','fixtures','voyages','voyage_account','companies','certificates')
        AND p.action = 'view')
    OR (p.module = 'settings' AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4) Performans: yetki sorgusu her istekte çalışır
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions (module, action);
