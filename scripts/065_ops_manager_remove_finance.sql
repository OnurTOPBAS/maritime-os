-- ============================================================================
-- Operations Manager rolünden finans (Office PnL) izinlerini kaldır
-- ============================================================================
--
-- Eskiden operations_manager, finance modülünü "view" yetkisiyle görebiliyordu
-- (bkz. 054). Kullanıcı kararı: operasyon rolü mali veriye (Office PnL) hiçbir
-- şekilde erişmemeli. Bu betik mevcut kurulumlardan finance izinlerini siler.
-- (054 de güncellendi; temiz kurulumlar zaten finance vermez.)
--
-- Not: Bu yalnızca sistem tanımlı operations_manager rolünü etkiler. Kullanıcı
-- daha sonra dilerse Rol Yönetimi'nden finance/görüntüleme'yi geri ekleyebilir.
--
-- Betik idempotenttir.
-- ============================================================================

DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.slug = 'operations_manager'
  AND p.module = 'finance';
