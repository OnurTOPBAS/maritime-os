# Çalışma Planı — Güvenlik & Mimari Düzeltmeleri

> Kaynak: `Proje-Degerlendirme-Raporu.docx`
> Çalışma tarzı: **Kodu Onur yazar, Claude yönlendirir.** Her adımda dosya + ne yazılacağı belirtilir, sonra kontrol edilir.
> Not: Bir günü bitirince ilgili kutuyu `[x]` yap.

---

## Gün 1 — Temeller: Ortak DB + JWT anahtarı
**Amaç:** Dağınık `neon()` bağlantılarını tek `lib/db.ts`'e topla + JWT sabit yedek anahtarını kaldır (G-04).
- [x] `lib/db.ts` gözden geçir (tek export edilen `sql`) — zaten doğruydu, fail-fast var
- [x] `middleware.ts` — JWT_SECRET yedeğini kaldır, env yoksa hata fırlat
- [x] `lib/auth.ts` — aynı düzeltme
- [ ] Test: giriş yap/çık çalışıyor mu (DATABASE_URL bağlanınca)
**Öğrenilecek:** DB ve oturum bağlantısı nasıl kuruluyor, "tek kaynak" (encapsulation) neden önemli.

## Gün 2 — Yetki helper'ı (RBAC'in kalbi)
**Amaç:** "Bu kullanıcı bu şirkette bu işlemi yapabilir mi?" sorusunu tek fonksiyonda topla.
- [x] `lib/authz.ts` oluştur → `requireCompanyAccess(userId, companyId, action)`
- [x] `lib/permissions.ts` ile birleştir (sahiplik + rol) — artık authz.ts'i sarmalıyor
- [x] `lib/api-error.ts` — hataları doğru HTTP koduna çeviren ortak yardımcı
- [x] `lib/session.ts` — `UnauthorizedError` tipi eklendi (geriye uyumlu)
- [ ] Test: viewer rolüyle yazma denemesi engelleniyor mu (DB bağlanınca)

**Yol boyunca bulunan ek kusurlar (raporda yoktu):**
- `user_permissions.is_active` hiç kontrol edilmiyordu → pasif kullanıcı yetkili sayılıyordu
- Üyeliği olmayan yabancı kullanıcıya varsayılan `viewer` veriliyordu → başka şirketin verisini görebilirdi
- İki paralel üyelik tablosu var (`user_permissions` + `company_team_members`) → authz.ts ikisini de kontrol ediyor
**Bağlı bulgular:** M-01, G-02, G-03 çözümünün temeli.

## Gün 3 — IDOR + korumasız yetki sayfaları
**Amaç:** G-03 (ekip üyesi silme) + G-02 (roles/permissions rotaları).
- [x] `app/api/companies/[id]/team/[memberId]/route.ts` — sahiplik doğrula (IDOR kapandı)
- [x] `app/api/companies/[id]/team/route.ts` — yetki yükseltme açığı kapandı
- [x] `app/api/roles/**` — auth + `requireSystemAdmin` eklendi (3 dosya)
- [x] `app/api/permissions/route.ts` — auth eklendi
- [x] `lib/authz.ts` — `requireSystemAdmin` helper'ı eklendi

**Yol boyunca bulunan ek kusurlar:**
- `team/route.ts` POST: **herkes herhangi bir şirkete kendini `admin` olarak ekleyebiliyordu** (yetki yükseltme)
- Rol alanları allow-list'e karşı doğrulanmıyordu → artık sadece admin/manager/viewer
- Şirket sahibi ekipten çıkarılabiliyor/rolü düşürülebiliyordu → şirket sahipsiz kalabilirdi
- Sistem rollerinin izinleri değiştirilebiliyordu → artık korumalı

## Gün 4 — Dosya yüklemeyi güvene al
**Amaç:** G-01 + G-06.
- [x] `app/api/upload/route.ts` — auth eklendi (G-01 kapandı)
- [x] `app/api/upload/signature`, `profile-photo` — doğrulama sıkılaştırıldı
- [x] `app/api/documents/upload` — auth + sahiplik + doğrulama
- [x] `lib/upload-validation.ts` — sunucu tarafı doğrulama modülü (6/6 test geçti)
- [x] Dosya adı temizleme (yol geçişi + üzerine yazma engellendi)
- [ ] Blob'u private yapmak — Vercel plan desteği gerektiriyor, ayrıca değerlendirilecek (G-06 kısmen açık)

**Yol boyunca bulunan ek kusurlar:**
- `documents/upload`: **başkasının gemisine/faturasına belge iliştirilebiliyordu** (IDOR) → sahiplik doğrulaması eklendi
- Hata yanıtlarında `error.stack` istemciye gönderiliyordu (bilgi sızıntısı) → kaldırıldı
- İmza yüklemede `image/*` kabul ediliyordu → `image/svg+xml` ile betik yüklenebilirdi; artık allow-list
- Ham dosya adı depolama yoluna yazılıyordu → aynı adlı dosya başkasınınkini ezebilirdi

## Gün 5 — GENİŞLETİLDİ: Sahiplik doğrulaması + auth'suz rotalar
**Amaç:** G-10 (YENİ, kritik) + G-05. Tahmini 1-2 gün.

### 5a) G-10 — Sahiplik doğrulaması olmayan 32 rota (KRİTİK)
Bu rotalar giriş kontrolü yapıyor ama kaydın kime ait olduğuna bakmıyor.
Grup grup ilerle; her rotayı düzeltirken `lib/db.ts`'e de taşı (M-02 borcu azalsın).
- [x] `voyage-account/**` (11 rota) — sefer gelir/maliyet/yakıt/bacak/faaliyet
- [x] `office-pnl/route.ts` + `record/[id]` — kâr-zarar (en kritik mali sızıntı)
- [x] `documents/**` (3 rota) — belge okuma/yükleme/silme
- [x] `audit-logs` — başkasının etkinlik kaydı sorgulanabiliyordu
- [x] `certificates/**` (6 rota) — sürümler, denetim kaydı, toplu işlemler
- [x] `office-pnl` global tablolar (fee-codes, payee-banks, bank-balances, monthly-reports, update-balance) — admin şartı
- [x] `dashboard/counts` — tüm sistemin sayılarını sızdırıyordu
- [x] `notifications/[id]/read` — hiçbir şey yapmıyordu, çalışır hale getirildi
- [x] `permissions/[userId]` + `lib/custom-permissions.ts` — bozuk tipler düzeltildi

**DURUM: G-10 KAPANDI. 32 → 0 gerçek açık.** `neon()` kuran rota: 81 → 54.
(`permissions/route.ts` salt-okunur global katalog; `requireAuth` yeterli.)

**Yol boyunca bulunan ek kusurlar:**
- `office-pnl` GET: **tüm şirketlerin mali verisi** dönüyordu (filtre yalnızca JS'te, isteğe bağlı) → SQL'e taşındı + şirket sınırı
- `documents` GET: filtresiz çağrıda tüm şirketlerin belgeleri listeleniyordu
- Alt kayıt işlemleri (`costId`, `legId`, `activityId`...) üst kayda bağlanmıyordu → kendi seferin + başkasının kaydı ile IDOR mümkündü; `WHERE` koşullarına `voyage_id` eklendi
- `updateVoyageTotals` iki dosyada birebir kopyalanmıştı (~50 satır) → `lib/voyage-totals.ts`'e çıkarıldı
- `audit-logs`: `limit` sınırsızdı → 200 ile sınırlandı

### 5b) G-05 — Auth'suz rotalar ✅ TAMAMLANDI
- [x] `app/api/*/import/**` (ships, invoices, voyages, fixtures) — auth + sahiplik
- [x] `app/api/voyage-calculator/**` (6 rota)
- [x] `favorites`, `user-preferences`, `recent-items`
- [x] `voyages/stats`, `fixtures/stats`
- [x] `ports/search`, `certificate-requirements`
- [x] `ships/[id]/compliance`, `ships/[id]/vetting/.../deficiencies`
- [x] `notifications/send-reminders` — CRON_SECRET ile korundu
- [x] Meşru public kalanlar: `signin`, `signup`, `signout`, `forgot-password`,
      `reset-password`, `invitations/accept`

**Sonuç: 31 → 6 (hepsi meşru public). Sahiplik açığı: 32 → 3 (paylaşılan referans tabloları).**

**Yol boyunca bulunan ek kırık özellikler:**
- `invoices/import`: var olmayan `team_members` tablosunu sorguluyordu → her istekte 500
- `voyage-calculator/templates` ve `duplicate`: kurulu olmayan **next-auth** kullanıyordu → her istekte 401
- `voyages/stats` ve `fixtures/stats`: `Authorization: Bearer` bekliyordu, oysa uygulama çerez kullanıyor → her istekte 401
- `voyage-calculator/setup` ve `init`: kimlik doğrulaması olmadan **veritabanı şeması oluşturuyordu** (DDL)
- `notifications/send-reminders`: korumasızdı; herkes tüm şirketlere toplu e-posta gönderimi tetikleyebiliyordu
- Import rotaları herhangi bir filoya/gemiye/şirkete veri basmaya izin veriyordu

## Gün 6 — Giriş güvenliği
**Amaç:** G-07 + G-08.
- [x] `signin` — deneme sınırı (`lib/rate-limit.ts` + `scripts/052_add_login_attempts.sql`)
- [x] `signup` + `reset-password` + davet kabul — parola politikası (`lib/password-policy.ts`, 9/9 test)
- [x] E-posta biçim doğrulaması + normalleştirme (küçük harf)
- [x] bcrypt maliyeti 10 → 12 yükseltildi
- [x] `handleApiError` 429 (çok fazla deneme) desteği

**⚠️ KURULUM GEREKLİ:** `scripts/052_add_login_attempts.sql` Neon'da çalıştırılmalı,
yoksa oran sınırlama devreye girmez (giriş çalışmaya devam eder).

**Yol boyunca bulunan ek kusurlar:**
- Davet kabulünde **mevcut kullanıcının parolası değiştiriliyordu** → davet bağlantısıyla hesap ele geçirilebilirdi; artık dokunulmuyor
- `signin` hata mesajları hesabın varlığını sızdırabiliyordu → tek tip mesaj
- Şifre sıfırlamada eski tokenlar geçersiz kılınmıyordu → artık kılınıyor
- Parola üst sınırı yoktu → çok uzun girdi ile CPU tüketimi (DoS) mümkündü

## Gün 7 — Kalite: tip kontrolü + log temizliği ✅
**Amaç:** K-01 + G-09.
- [x] Sunucu taraflı 61 `console.log` temizlendi (PII sızıntısı); 193 `console.error` korundu
- [x] 25 rotada Next.js 15 `params` imzası düzeltildi (`Promise` + `await`)
- [x] **API katmanında tip hatası sıfırlandı**; toplam 167 → 71 (kalanlar arayüz bileşenlerinde)
- [ ] `next.config.mjs` `ignoreBuildErrors` kapatılması — arayüz hataları bitince

**Yol boyunca bulunan ek kırık özellikler:**
- `departments` ve `groups`: `user.companyId` alanı yok → sorgular boş dönüyor, ekleme
  NOT NULL kısıtına takılıyordu. **Departman/grup özellikleri hiç çalışmamıştı.** Düzeltildi ve test edildi.
- `import/ships` ve `import/invoices`: `validateShip()` dizi döndürürken kod `.valid`
  bekliyordu → **her satır doğrulamadan kalıyordu**, aktarım hiç çalışmıyordu
- `import/ships`: var olmayan `ship_type` sütununa yazıyordu (doğrusu `vessel_type`)
- İki paralel import uç noktası var (`/api/ships/import` ve `/api/import/ships`);
  ikisi de farklı bileşenlerden kullanılıyor, ikisi de düzeltildi

## Gün 8 — Standartlaştırma + testler ✅
**Amaç:** M-03 + K-02.
- [x] **Test altyapısı kuruldu** (Vitest) — `npm test`
- [x] **56 test yazıldı, hepsi geçiyor**:
      `tests/authz.test.ts` (16) — gerçek veritabanına karşı yetki kuralları
      `tests/password-policy.test.ts` (14) — parola + e-posta doğrulama
      `tests/upload-validation.test.ts` (16) — dosya güvenliği
      `tests/rate-limit.test.ts` (10) — brute-force koruması
- [x] Testlerin işe yaradığı kanıtlandı: `authz.ts`'e kasıtlı açık eklendi,
      5 test anında kırmızıya döndü; açık geri alındı
- [x] `favorites` / `recent-items` / `user-preferences` iç `fetch` anti-pattern'i kaldırıldı
- [x] Tüm rotalarda null kontrolü doğrulandı (eksik yok)
- [x] Kullanılmayan 17 arayüz bileşeni kaldırıldı → tip hatası 71 → 45
- [x] **`ignoreBuildErrors` KALDIRILDI** — tip hatası 167 → 0, üretim derlemesi başarılı

**Not:** `getCurrentUser` (50 dosya) ile `requireAuth` (97 dosya) işlevsel olarak
eşdeğerdir; toplu değiştirmek gereksiz risk taşıdığı için yapılmadı. Kritik olan
null kontrolünün her yerde bulunduğu doğrulandı.

---

## GENEL DURUM (Gün 1-8 sonrası)

| Ölçüt | Başlangıç | Şimdi |
|---|---|---|
| Kimlik doğrulaması olmayan rota | 31 | 6 (hepsi meşru public) |
| Sahiplik kontrolü olmayan rota | 32 | 3 (paylaşılan referans tabloları) |
| Kendi DB bağlantısını kuran dosya | 81 | 0 |
| Merkezî yetki katmanı kullanan rota | 0 | 48 |
| Tip hatası | 167 | **0** |
| Sunucu tarafı debug logu | 61 | 0 |
| Otomatik test | 0 | 56 |

**Kapatılan güvenlik bulguları:** G-01, G-02, G-03, G-04, G-05, G-07, G-08, G-09, G-10, G-11
**Kısmen açık:** G-06 (dosya erişimi — barındırma kararına bağlı)
**Kapatıldı:** K-01 (tip hataları sıfırlandı, derleme koruması açık)
