-- Varsayılan temayı "system"den "light"a çeker.
--
-- Sebep: tema "system" olduğunda next-themes işletim sisteminin temasına
-- uyuyordu; sunucu/tarayıcı karanlık temadaysa ayarlar sayfası açılınca
-- uygulama sürpriz şekilde koyu moda geçiyordu. Koyu tema stilleri de henüz
-- düzgün değil. Bu yüzden varsayılan açık tema; koyuyu isteyen elle seçer.

-- Yeni kullanıcılar için kolon varsayılanı.
ALTER TABLE user_preferences ALTER COLUMN theme SET DEFAULT 'light';

-- Mevcut "system" kayıtlarını açık temaya çevir (açık bir tercih değildi).
UPDATE user_preferences SET theme = 'light' WHERE theme = 'system' OR theme IS NULL;
