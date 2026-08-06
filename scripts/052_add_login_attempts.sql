-- Giriş denemelerinin kaydı (brute-force koruması için)
-- G-07: signin uç noktasında oran sınırlama yoktu.

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Kimlik: e-posta (küçük harfe indirgenmiş) veya IP adresi
  identifier VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64),
  successful BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Son denemeleri hızlı saymak için
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier
  ON login_attempts (identifier, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
  ON login_attempts (ip_address, attempted_at DESC);

-- Eski kayıtların temizliği için (isteğe bağlı bakım işi):
--   DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '7 days';
