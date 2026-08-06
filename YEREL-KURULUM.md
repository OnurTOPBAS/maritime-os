# Yerel Geliştirme Kurulumu

Uygulama **standart PostgreSQL** kullanır (tek sürücü: `postgres`).
Aynı kod yerel geliştirmede, kiralanan sunucuda ve yönetilen bir Postgres
servisinde değişiklik gerekmeden çalışır — yalnızca `DATABASE_URL` değişir.

## Mevcut yerel kurulum

| | |
|---|---|
| Sunucu | Postgres.app (PostgreSQL 18.4) |
| Veritabanı | `fidelity_denizcilik` |
| Bağlantı | `postgres://onur@localhost:5432/fidelity_denizcilik` |
| Tablo sayısı | 90 |
| DBeaver | Yukarıdaki bilgilerle bağlanabilirsin (şifre yok) |

## Günlük kullanım

1. **Postgres.app'i başlat** (menü çubuğundaki fil simgesi) — ya da:
   ```bash
   open -a Postgres
   ```

2. **Uygulamayı çalıştır:**
   ```bash
   npm run dev
   ```

3. Tarayıcıda `http://localhost:3000`

## Test kullanıcısı

| E-posta | Şifre |
|---|---|
| `onur@test.local` | `Gemi2024Liman` |

Yeni kullanıcı `/auth/signup` üzerinden de açılabilir.
Şifre kuralı: en az 8 karakter, harf + rakam içermeli.

## Migration çalıştırma

Tüm migration'lar idempotent hale getirildi — istediğin kadar tekrar çalıştırabilirsin:

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
for f in $(ls scripts/*.sql | sort -V); do psql "postgres://onur@localhost:5432/fidelity_denizcilik" -q -f "$f"; done
```

## Sunucuya taşıma

Sunucuda PostgreSQL kurup `DATABASE_URL`'i güncellemek yeterli:

```
DATABASE_URL="postgres://kullanici:sifre@sunucu-adresi:5432/veritabani?sslmode=require"
```

`sslmode=require` görülürse TLS otomatik devreye girer. Ardından migration'ları
bir kez çalıştır (aşağıdaki komut, sunucu adresiyle).

**Not:** Dosya yükleme hâlâ Vercel Blob kullanıyor (`@vercel/blob`). Kendi
sunucunuza tam geçiş için bunun da değiştirilmesi gerekir (sunucu diski veya
S3 uyumlu bir depolama).

---

## Bu kurulum sırasında düzeltilen kusurlar

- **5 migration dosyası `INTEGER` yerine `UUID` kullanmalıydı** — bu tablolar hiçbir
  ortamda oluşturulamıyordu: `user_sessions`, `custom_permissions`, `departments`,
  `groups`, `user_group_members`. Yani departman/grup/oturum takibi özellikleri
  baştan beri çalışmıyordu.
- **`fuel_records` tablosu hiç oluşturulmuyordu** ama `app/api/voyages/[id]/fuel/route.ts`
  onu sorguluyordu → yakıt takibi kırıktı. Şema rotadan çıkarılıp
  `scripts/053_create_fuel_records.sql` olarak eklendi.
- **`031_voyage_calculator.sql` ile `032_voyage_calculator_simple.sql` aynı tabloyu
  farklı tasarımla oluşturuyordu** → 031 devre dışı bırakıldı (`.superseded`).
- **`038_update_fuel_records_structure.sql`** var olmayan eski veriyi taşımaya
  çalışıyordu → devre dışı bırakıldı (053 zaten tüm sütunları içeriyor).
- **62 indeks, trigger ve policy idempotent değildi** → migration'lar ikinci kez
  çalıştırılamıyordu. Hepsine `IF NOT EXISTS` / `DROP ... IF EXISTS` eklendi.
- **56 dosya kendi veritabanı bağlantısını kuruyordu** → hepsi `lib/db.ts`'e taşındı.
  Bu sayede sürücüyü tek dosyada değiştirmek mümkün oldu.
