-- Süper yönetici (super admin) bayrağı.
--
-- Normalde yetki şirket bazlıdır: bir kullanıcı yalnızca sahibi/üyesi olduğu
-- şirketleri görür. Süper yönetici bunun istisnasıdır — sistemdeki TÜM
-- şirketleri görür ve yönetir. Tek bir bayrakla kontrol edilir; hiçbir
-- şirkete üye olması gerekmez.
--
-- Bir kullanıcıyı süper yönetici yapmak için:  node scripts/superadmin.mjs <email>

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;
