# Güvenlik ve Test Raporu

> Kapsamlı iki aşamalı denetim: (1) işlevsellik + yetki doğrulama, (2) güvenlik/sızma testleri.
> Tüm sonuçlar çalıştırılabilir testlerle doğrulanmıştır: `npm run test:all`

---

## Özet

| | |
|---|---|
| Toplam otomatik test | **234** (82 birim + 152 entegrasyon/güvenlik) |
| Başarısız | **0** |
| Tip hatası | **0** |
| Bu denetimde bulunan ve kapatılan açık | **11** |

---

## FAZ 1 — İşlevsellik ve yetki testleri

### 1a. Duman testi (62 rota)
Parametresiz tüm GET uç noktaları yetkili oturumla çağrıldı.

**Bulunan 4 kırık rota (hepsi düzeltildi):**

| Rota | Sorun |
|---|---|
| `certificates/expiring` | `EXTRACT(DAY FROM date - date)` geçersiz tip — her istekte 500 |
| `certificates/reports/expiring` | `INTERVAL '${days} days'` string birleştirme — 500 **ve enjeksiyon riski** |
| `office-pnl/bank-balances` | Var olmayan `is_active` sütunu sorgulanıyordu |
| `users/login-history` | Var olmayan `last_activity` sütunu (doğrusu `last_active`) |

### 1b. CRUD yaşam döngüsü (18 test)
Şirket → filo → gemi → fixture → sefer → fatura → departman zinciri uçtan uca kuruldu, okundu, güncellendi, silindi.

**Bulunan sorunlar:**
- **Filo listesi eksik veri gösteriyordu** — `LIMIT 1` ile rastgele tek şirket seçiliyordu; birden fazla şirketi olan kullanıcı diğer filolarını göremiyordu.
- **Gemi/sefer güncelleme 500 veriyordu** — sürücü değişiminin yan etkisi: `postgres` sürücüsü `undefined` değerleri reddediyor (eski Neon sürücüsü sessizce `NULL`'a çeviriyordu). **89 satırda aynı risk vardı**; `lib/db.ts` sarmalayıcısında tek noktada çözüldü.
- **`fixtures/[id]` GET handler'ı yoktu** — tekil fixture görüntüleme 405 veriyordu.

### 1c/1d. Yetki (RBAC) zorlaması — 34 test

**Sorunun cevabı: Evet, artık yetki atadığınız kişi yalnızca o yetkileri kullanabiliyor.**

Doğrulanan senaryolar:

| Rol | Yapabildiği | Engellenen |
|---|---|---|
| Viewer | Görüntüleme | Düzenleme, silme, fatura oluşturma — **403** |
| Finance Manager | Fatura yönetimi, rapor | Gemi düzenleme/silme — **403** |
| Technical Manager | Gemi/sertifika/belge | Fatura oluşturma — **403** |
| Operations Manager | Sefer/fixture yönetimi | Fatura silme — **403** |

**Şirketler arası izolasyon (en kritik):** B şirketinin admin'i, A şirketinin gemisini/faturasını/seferini **göremiyor, değiştiremiyor, silemiyor**; liste uç noktaları da A'nın verisini sızdırmıyor.

**Bulunan kritik açıklar:**

1. **36 rota merkezi yetki katmanını atlıyordu.** Bu rotalar yalnızca "şirkete üye mi?" diye bakıyor, **rol ayrımı yapmıyordu** — yani `viewer` bile yazma işlemi yapabiliyordu. Ayrıca yalnızca `company_team_members` tablosuna baktıkları için, Kullanıcılar ekranından eklenen üyeleri (`user_permissions`) hiç tanımıyorlardı.
2. **`invoices` POST'ta hiçbir şirket yetki kontrolü yoktu** — herhangi bir kullanıcı, herhangi bir `companyId` göndererek fatura oluşturabilirdi.

Her ikisi de merkezi `lib/authz.ts` katmanına taşındı.

---

## FAZ 2 — Güvenlik testleri (38 test)

### 🔴 Kritik: SQL enjeksiyonu — bulundu ve kapatıldı

`app/api/tasks/route.ts` filtreleri sorgu metnine doğrudan birleştiriyordu:

```js
query += ` AND t.status = '${status}'`   // ESKİ — açık
tasks = await sql.unsafe(query)
```

**Sömürülebilir olduğu kanıtlandı:** `?status=x' OR '1'='1` isteği WHERE koşulunu atlattı.
`UNION SELECT` ile `users` tablosundan veri çekme yolu da açıktı.

Düzeltme: tüm filtreler parametreli sorguya taşındı, `sql.unsafe` kaldırıldı. Regresyon testi eklendi.

### Test edilen saldırı vektörleri (tümü savunuldu)

| Saldırı | Sonuç |
|---|---|
| Kimlik doğrulama atlatma (6 uç nokta) | ✅ Engellendi |
| Sahte JWT | ✅ Reddedildi |
| **`alg:none` JWT saldırısı** | ✅ Reddedildi |
| SQL enjeksiyonu (4 payload + görev filtresi) | ✅ Etkisiz |
| IDOR / kaynak numaralandırma | ✅ 403/404 |
| Kütle atama (kayıtta `role:admin` gönderme) | ✅ Yok sayıldı |
| Yetki yükseltme (kendini admin ekleme) | ✅ 403 |
| Brute-force | ✅ 6. denemede 429 |
| Kullanıcı numaralandırma | ✅ Tek tip hata mesajı |
| Cron uç noktası (anahtarsız/yanlış anahtar) | ✅ 401 |
| Hata mesajlarında iç detay sızıntısı | ✅ Yok |

### 🟠 Eksik güvenlik başlıkları — eklendi

Uygulamada **hiçbir güvenlik başlığı tanımlı değildi.** `next.config.mjs`'e eklendi:

| Başlık | Koruduğu |
|---|---|
| `X-Frame-Options: DENY` | Clickjacking |
| `Content-Security-Policy` | XSS, veri sızdırma |
| `X-Content-Type-Options: nosniff` | MIME tipi karıştırma |
| `Referrer-Policy` | URL/kimlik sızıntısı |
| `Permissions-Policy` | Kamera/mikrofon/konum erişimi |
| `Strict-Transport-Security` | HTTPS zorlaması (üretimde) |
| `poweredByHeader: false` | Teknoloji parmak izi |

---

## Anahtar ve sır yönetimi

| Kontrol | Durum |
|---|---|
| `.env` dosyaları git'te izleniyor mu | ✅ Hayır (`.gitignore`: `.env*`) |
| Git geçmişinde sır sızıntısı | ✅ Yok |
| Kod içinde gömülü sır | ✅ Yok |
| Sunucu sırlarının istemciye sızması | ✅ Yok (`NEXT_PUBLIC_` yalnızca uygulama adresi) |
| JWT sabit yedek anahtarı | ✅ Kaldırıldı — env yoksa uygulama başlamıyor |

**Kullanılan sırlar:** `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, `EMAIL_API_KEY`

### Oturum güvenliği

| Ayar | Değer |
|---|---|
| `HttpOnly` | ✅ (JavaScript çerezi okuyamaz) |
| `SameSite` | ✅ `lax` (CSRF koruması) |
| `Secure` | ✅ Üretimde otomatik |
| JWT algoritma / süre | HS256 / 7 gün |
| Şifre hashleme | bcrypt maliyet **12** (tüm noktalarda tutarlı) |

---

## Sunucuya geçmeden önce yapılması gerekenler

### Zorunlu

1. **Ortam değişkenlerini üretim için üretin** — yerel değerleri taşımayın:
   ```bash
   openssl rand -hex 48   # JWT_SECRET
   openssl rand -hex 32   # CRON_SECRET
   ```
2. **`NODE_ENV=production`** ayarlayın — `Secure` çerez ve HSTS bunun üzerinden etkinleşir.
3. **HTTPS zorunlu.** Sertifika (Let's Encrypt) + HTTP'den HTTPS'e yönlendirme.
4. **Veritabanı kullanıcısını kısıtlayın** — uygulama `SUPERUSER` ile bağlanmamalı:
   ```sql
   CREATE USER app_user WITH PASSWORD '...';
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   -- DDL (CREATE/DROP) yetkisi VERİLMEZ
   ```
5. **Veritabanı dışarıya kapalı olsun** — yalnızca uygulama sunucusundan erişim (firewall).
6. **Dosya yükleme** hâlâ Vercel Blob kullanıyor; kendi sunucunuzda çalışmaz. Sunucu diski veya S3 uyumlu depolama (MinIO) gerekir. Yüklenen dosyalar şu an **herkese açık adreste** — özel erişime alınmalı.

### Önerilen

7. **Yedekleme** — günlük otomatik `pg_dump`, ayrı bir konumda saklanmalı ve **geri yükleme denenmiş** olmalı.
8. **Oturum süresi** 7 gün uzun; hassas veri için 24 saat + yenileme mekanizması düşünülmeli.
9. **Oran sınırlama yalnızca girişte var** — API geneline (ör. IP başına dakikada 100 istek) ters vekil (nginx) düzeyinde eklenmeli.
10. **Denetim kaydı (audit log)** mevcut ama tüm yazma işlemlerini kapsamıyor; finansal işlemler için genişletilmeli.
11. **Bağımlılık taraması** — `npm audit` düzenli çalıştırılmalı; CI'a eklenmeli.
12. **İzleme/uyarı** — 5xx artışı, 429 artışı (saldırı göstergesi) ve disk/bağlantı havuzu için uyarı kurun.
13. **Bağımsız sızma testi** — bu rapor kod incelemesi ve otomatik teste dayanır; yayına geçmeden profesyonel pentest önerilir.

---

## Testleri çalıştırma

```bash
npm run test:all      # birim + entegrasyon + güvenlik (234 test)
npm run test:qa       # yalnızca canlı API testleri (uygulama ayakta olmalı)
npm test              # yalnızca birim testler
```

QA testleri `scripts/qa/` altındadır ve gerçek HTTP istekleriyle çalışır; test verisini kendisi oluşturup temizler.
