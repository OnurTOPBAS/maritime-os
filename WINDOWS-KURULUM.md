# Windows Sunucusuna Kurulum

Bu rehber, uygulamayı bir Windows sunucusuna sıfırdan kurmayı anlatır. Kurulunca
ofis ağındaki herkes tarayıcıdan girip kullanabilir/test edebilir.

Adımları sırayla takip edin. Komutları **PowerShell**'de çalıştırın (Başlat →
"PowerShell" yazıp "Yönetici olarak çalıştır").

---

## Özet: ne kuracağız

1. Node.js (uygulamayı çalıştırır)
2. PostgreSQL (veritabanı)
3. Git (kodu çekmek için)
4. Projeyi indir, ayarla, veritabanını kur, derle
5. Uygulamayı Windows servisi yap (bilgisayar açıldığında kendi başlar)
6. Güvenlik duvarında portu aç (herkes erişsin)

Tahmini süre: 30–45 dakika.

---

## 1. Node.js kurulumu

1. https://nodejs.org adresine gidin.
2. **LTS** sürümünü indirin (yeşil buton, "20.x LTS" gibi).
3. İndirilen `.msi` dosyasını çalıştırın, hep "Next" diyerek kurun.
4. Kurulumu doğrulayın — PowerShell'de:
   ```powershell
   node --version
   npm --version
   ```
   İkisi de sürüm numarası yazdırmalı (örn. `v20.11.0`).

---

## 2. PostgreSQL kurulumu

1. https://www.postgresql.org/download/windows/ → "Download the installer".
2. Güncel sürümü (16 veya 17) indirin, kurun.
3. Kurulum sırasında:
   - **Şifre**: `postgres` kullanıcısı için bir şifre belirleyin. **Bu şifreyi bir yere not edin**, birazdan lazım olacak.
   - **Port**: 5432 (varsayılan, değiştirmeyin).
   - "Stack Builder" isterse **atlayın** (gerekli değil).
4. Kurulum bitince "pgAdmin" veya "SQL Shell (psql)" başlat menüsüne gelir.

### Veritabanını oluşturun

Başlat menüsünden **SQL Shell (psql)** açın. Sorulara şöyle cevap verin
(hepsinde Enter, sadece şifreyi girin):

```
Server [localhost]:      (Enter)
Database [postgres]:     (Enter)
Port [5432]:             (Enter)
Username [postgres]:     (Enter)
Password:                (kurulumda belirlediğiniz şifre)
```

Açılan ekranda şunu yazıp Enter'a basın:

```sql
CREATE DATABASE maritime;
```

`CREATE DATABASE` yazısını görünce tamam. Pencereyi kapatabilirsiniz.

---

## 3. Git kurulumu

1. https://git-scm.com/download/win → indirip kurun (hep "Next").
2. Doğrulayın:
   ```powershell
   git --version
   ```

---

## 4. Projeyi indirme ve ayarlama

### Kodu çekin

Projeyi nereye koyacağınıza karar verin, örneğin `C:\maritime`:

```powershell
cd C:\
git clone https://github.com/OnurTOPBAS/maritime-os.git maritime
cd C:\maritime
```

> Not: Depo özelse Git sizden GitHub kullanıcı adı/şifre (veya token) isteyebilir.

### Ortam değişkenleri dosyasını oluşturun

Önce güvenli anahtarları üretin:

```powershell
node scripts\windows\anahtar-uret.mjs
```

Bu size `JWT_SECRET` ve `CRON_SECRET` satırları verecek. Şimdi proje kökünde
`.env.local` adında bir dosya oluşturun (Not Defteri ile) ve içine şunu yazın —
**büyük harfli yerleri kendi değerlerinizle değiştirin**:

```
DATABASE_URL="postgres://postgres:POSTGRES_SIFRENIZ@localhost:5432/maritime"

JWT_SECRET="URETILEN_JWT_DEGERI"
CRON_SECRET="URETILEN_CRON_DEGERI"

NODE_ENV="production"

# Sunucunun ağdaki adresi (5. adımda IP'yi öğrenince güncelleyin).
# Bu değer çalışma zamanında okunur; sonradan değiştirirseniz sadece
# servisi yeniden başlatmak yeterli (yeniden derleme gerekmez).
APP_URL="http://SUNUCU-IP:3000"

# Yüklenen dosyaların saklanacağı klasör (sunucu diski)
UPLOAD_DIR="C:\maritime\var\uploads"
```

> `POSTGRES_SIFRENIZ` = 2. adımda belirlediğiniz postgres şifresi.
> Şifrede `@ : / ?` gibi karakter varsa söyleyin, kodlanmış hali gerekir.

### Bağımlılıkları kurun, veritabanını hazırlayın, derleyin

```powershell
npm install
npm run migrate
npm run build
```

- `npm run migrate` → tüm tabloları kurar ("58 başarılı" görmelisiniz).
- `npm run build` → uygulamayı derler ("Compiled successfully" görmelisiniz).

### İlk yönetici hesabını oluşturun

Uygulamayı bir kez elle başlatın:

```powershell
npm start
```

Sunucudaki tarayıcıdan `http://localhost:3000/auth/signup` adresine gidip
ilk hesabınızı oluşturun. Sonra PowerShell'de `Ctrl + C` ile durdurun
(servis olarak sürekli çalıştırmayı bir sonraki adımda kuracağız).

---

## 5. Sürekli çalışır hale getirme (Windows servisi)

`npm start` penceresi kapanınca uygulama durur. Bilgisayar açıldığında kendi
başlaması için **NSSM** (küçük, güvenilir bir araç) kullanacağız.

1. https://nssm.cc/download → "nssm 2.24" indirin. ZIP'i açın.
2. İçinden `win64\nssm.exe` dosyasını `C:\Windows\System32` klasörüne kopyalayın
   (böylece her yerden `nssm` yazabilirsiniz).
3. Servisi oluşturun (Yönetici PowerShell):
   ```powershell
   nssm install MaritimeOS
   ```
   Açılan pencerede:
   - **Path**: `C:\Program Files\nodejs\node.exe`
   - **Startup directory**: `C:\maritime`
   - **Arguments**: `node_modules\next\dist\bin\next start -p 3000`
   - "Install service" tıklayın.
4. Servisi başlatın:
   ```powershell
   nssm start MaritimeOS
   ```
5. Kontrol: tarayıcıdan `http://localhost:3000` açılmalı.

Artık uygulama sunucu her açıldığında kendiliğinden çalışır.

> Durdurmak: `nssm stop MaritimeOS` — Başlatmak: `nssm start MaritimeOS`

---

## 6. Ağdaki herkesin erişmesi

### Sunucunun IP adresini öğrenin

```powershell
ipconfig
```

"IPv4 Address" satırındaki adresi bulun, örn. `192.168.1.50`.

### Güvenlik duvarında portu açın

```powershell
New-NetFirewallRule -DisplayName "MaritimeOS" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Test edin

Ofis ağındaki herhangi bir bilgisayardan tarayıcıya şunu yazın:

```
http://192.168.1.50:3000
```

(kendi IP'nizle). Giriş ekranı geliyorsa **kurulum tamam** — herkes buradan
girip test edebilir.

> `.env.local` içindeki `APP_URL`'i de bu IP ile güncelleyip servisi yeniden
> başlatın (`nssm restart MaritimeOS`). Yeniden derlemeye gerek yok.

---

## Güncellemeler nasıl yapılır

Kodda değişiklik olduğunda (biz yeni sürüm çıkarınca), sunucuda proje
klasöründe tek komut:

```powershell
scripts\windows\guncelle.bat
```

Bu; son sürümü çeker, bağımlılıkları kurar, veritabanını günceller, derler ve
servisi yeniden başlatır. Migration'lar idempotent olduğu için veri kaybı olmaz.

---

## Sık karşılaşılan sorunlar

**"npm run migrate" bağlantı hatası veriyor**
`.env.local` içindeki `DATABASE_URL`'i kontrol edin — postgres şifresi doğru mu,
veritabanı adı `maritime` mi. PostgreSQL servisi çalışıyor mu (Görev Yöneticisi →
Hizmetler → `postgresql-x64-16` çalışıyor olmalı).

**Başka bilgisayardan açılmıyor ama sunucuda açılıyor**
Güvenlik duvarı kuralını atlamış olabilirsiniz (6. adım). Ayrıca sunucu ve diğer
bilgisayarın aynı ağda olduğundan emin olun.

**Dosya yüklemeleri**
Yüklenen dosyalar `UPLOAD_DIR` klasöründe (`C:\maritime\var\uploads`) durur.
Bu klasörü düzenli yedekleyin — veritabanı yedeği tek başına yeterli değildir.

**Şifreyi unutan kullanıcı**
Şu an "şifremi unuttum" e-posta gönderimi bağlı değil. Yönetici, Kullanıcılar
ekranından kullanıcının şifresini elle sıfırlayabilir.

---

## Dış dünyaya açmak (opsiyonel, şimdilik gerekmez)

İç ağda `http://` yeterlidir. Uygulamayı internete açacaksanız (ofis dışından
erişim) ek olarak şunlar gerekir: bir alan adı, HTTPS sertifikası (Let's Encrypt),
ve önüne bir ters vekil (IIS veya nginx). Bu adım şimdilik gerekli değil; iç
testler için mevcut kurulum yeterli. İhtiyaç olursa ayrıca anlatırız.
