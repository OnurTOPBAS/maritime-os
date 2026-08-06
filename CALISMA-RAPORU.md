# MaritimeOS — Çalışma Raporu

Bu belge, projede baştan sona ne yapıldığını anlatıyor. Nereden başladık, ne bulduk,
neyi nasıl düzelttik ve şu an nerede duruyoruz.

---

## Nereden başladık

Proje v0 ile üretilmiş, çalışan bir Next.js uygulamasıydı. Ekranlar hazırdı,
menüler duruyordu, ilk bakışta her şey yerli yerindeydi. Ama kodu incelemeye
başlayınca durum başka çıktı.

İlk taramada bulduklarımız:

- 152 API servisinin 31'i kimlik doğrulaması hiç yapmıyordu. Yani giriş yapmamış
  biri o adreslere doğrudan istek atabiliyordu.
- Rol sistemi (admin/yönetici/izleyici) ekranda görünüyordu ama arka planda
  neredeyse hiç uygulanmıyordu. 152 servisin sadece 7'si rol kontrolü yapıyordu.
- 81 dosya kendi veritabanı bağlantısını ayrı ayrı kuruyordu. Merkezî bir
  `lib/db.ts` vardı ama kimse kullanmıyordu.
- Kod içinde gömülü, tahmin edilebilir bir JWT yedek anahtarı duruyordu.
- Dosya yükleme adresi tamamen açıktı — internetteki herkes dosya atabilirdi.
- 167 tip hatası `ignoreBuildErrors: true` ayarıyla gizleniyordu.
- Hiç test yoktu. Sıfır.

Bunları bir rapora dökdük ve sekiz günlük bir plan çıkardık.

---

## Yapılan işler

### Temel altyapı

İlk iş, her yerde kullanılacak parçaları sağlamlaştırmak oldu:

- Koda gömülü JWT yedek anahtarı kaldırıldı. Artık ortam değişkeni yoksa uygulama
  sessizce zayıf bir anahtarla çalışmaya devam etmiyor, açıkça duruyor.
- `lib/authz.ts` yazıldı — "bu kullanıcı bu şirkette bu işlemi yapabilir mi?"
  sorusunu tek yerde cevaplayan merkezî yetki katmanı.
- `lib/api-error.ts` yazıldı. Hatalar artık doğru HTTP koduna çevriliyor:
  oturum yoksa 401, yetki yoksa 403, kayıt yoksa 404. Önceden her şey 401 ya da
  500 dönüyordu ve iç hata mesajları istemciye sızıyordu.
- Eski `lib/permissions.ts` yeni katmana bağlandı, kendi veritabanı bağlantısını
  kurmayı bıraktı.

### Yetki açıklarının kapatılması

En ciddi kısım buydu. Bulduklarımız sırayla:

- **Herkes kendini istediği şirkete yönetici olarak ekleyebiliyordu.** Ekip ekleme
  servisinde hiçbir yetki ve rol doğrulaması yoktu. Bu yetki yükseltme demek,
  yani en ağır açık türü.
- **Yetkilendirme ayarlarının kendisi korumasızdı.** Rol ve izin yöneten servisler
  kimlik doğrulaması yapmıyordu — giriş yapmamış biri rol oluşturup silebiliyordu.
- **Başka şirketin ekip üyesi silinebiliyordu.** Üye kimliği ile şirket kimliği
  arasındaki ilişki doğrulanmıyordu.
- **32 serviste kaydın kime ait olduğu hiç kontrol edilmiyordu.** Bu servisler
  "giriş yapmış mı?" diye bakıyor ama "bu kayıt bu kişinin mi?" diye sormuyordu.
  Yani sisteme kayıtlı herhangi biri, bir kimlik tahmin ederek başkasının
  belgesini silebilir, faturasını okuyabilir, sefer maliyetini görebilirdi.
- **Tüm şirketlerin mali verisi tek istekle alınabiliyordu.** Ofis kâr/zarar
  sorgusu her şeyi çekip filtrelemeyi JavaScript tarafında, üstelik isteğe bağlı
  olarak yapıyordu.
- **Sistemden çıkarılan kullanıcılar yetkili kalmaya devam ediyordu.** `is_active`
  sütunu vardı ama hiç kontrol edilmiyordu.
- **Üyeliği olmayan yabancılara varsayılan görüntüleme yetkisi veriliyordu.**

Hepsi kapatıldı. Şu an 153 servisin sadece 6'sı kimlik doğrulaması yapmıyor ve
bunların hepsi zaten öyle olması gereken yerler: giriş, kayıt, çıkış, şifremi
unuttum, şifre sıfırlama, davet kabul.

### Dosya yükleme

- Yükleme servisine kimlik doğrulaması eklendi.
- Sunucu tarafında dosya türü ve boyut denetimi yazıldı. Önceden bu kontrol sadece
  tarayıcıda vardı ve kolayca atlatılabiliyordu.
- Dosya adları temizleniyor. `../../etc/passwd.pdf` gibi bir ad artık zararsız
  hale getiriliyor, aynı adı yükleyen iki kişiden biri diğerinin dosyasını ezemiyor.
- İmza yüklemede sadece `image/*` kontrol ediliyordu; bu SVG'ye izin veriyordu ve
  SVG dosyaları JavaScript çalıştırabilir. Artık kesin bir liste var.
- Belge yüklerken başkasının gemisine/faturasına dosya iliştirilebiliyordu, o da
  kapatıldı.

### Giriş güvenliği

- Şifre deneme sınırı geldi. 15 dakikada aynı hesaba 5, aynı IP'den 20 başarısız
  deneme. Sunucusuz ortamda bellek güvenilmez olduğu için veritabanı üzerinden
  çalışıyor.
- Şifre kuralları eklendi: en az 8 karakter, harf ve rakam, yaygın şifre listesi,
  kendi adını veya e-postasını içeremez. Üç akışta birden geçerli — kayıt, şifre
  sıfırlama, davet kabul.
- Davet bağlantısıyla hesap ele geçirme açığı kapatıldı. Kayıtlı bir e-postaya
  davet gönderip o hesaba yeni şifre koymak mümkündü.
- Giriş hataları artık hesabın var olup olmadığını sızdırmıyor.
- Şifre hashleme maliyeti her yerde 12'ye eşitlendi.

### Kalite temizliği

- 61 adet `console.log` silindi. Bunlar kullanıcı kimliği, e-posta ve rol bilgisini
  sunucu kayıtlarına yazıyordu.
- 25 serviste Next.js 15'in `params` kuralı düzeltildi. Bu sadece tip hatası değil,
  çalışma zamanında da sorun çıkarabilecek bir uyumsuzluktu.
- Kullanılmayan 18 arayüz bileşeni kaldırıldı (v0'ın eklediği ama hiç kullanılmayan
  takvim, karusel, çekmece gibi parçalar). Silmeden önce her birinin gerçekten
  kullanılmadığını iki ayrı yöntemle doğruladık.
- Tip hataları 167'den 0'a indi ve `ignoreBuildErrors` kapatıldı. Artık hatalı bir
  tip üretim derlemesini durduruyor.

---

## Buluta bağımlılıktan kurtulma

Uygulama Neon (bulut Postgres) kullanıyordu ve senin o hesaba erişimin yoktu.
Kendi sunucunuzda çalışacağı netleşince tek sürücüye geçtik:

- `@neondatabase/serverless` paketi tamamen kaldırıldı. Artık standart PostgreSQL
  protokolü kullanılıyor; aynı kod yerelde, kiralanan sunucuda ve yönetilen bir
  serviste değişiklik gerekmeden çalışıyor.
- 56 dosya merkezî bağlantıya taşındı. Bu şart bir işti, yoksa hepsi buluta
  bağlanmaya çalışıp patlardı.
- Bilgisayarında zaten kurulu olan Postgres.app kullanıldı. 90 tablo kuruldu,
  uygulama tamamen yerelde çalışır hale geldi.

Bu geçiş sırasında veritabanı kurulum dosyalarında ciddi sorunlar çıktı:

- **Beş kurulum dosyası yanlış veri tipi kullanıyordu.** `INTEGER` yazılmıştı ama
  ilgili anahtarlar `UUID`. Veritabanı bu tabloları reddediyordu, yani departman,
  grup, oturum takibi ve özel izinler **hiçbir ortamda hiç oluşturulamamıştı**.
- **`fuel_records` tablosunu hiçbir dosya oluşturmuyordu** ama bir servis onu
  sorguluyordu. Yakıt takibi baştan beri kırıktı.
- İki dosya aynı tabloyu farklı tasarımla kurmaya çalışıyordu.
- 62 indeks, trigger ve politika ikinci kez çalıştırılamıyordu. Artık 58 kurulum
  dosyasının tamamı istendiği kadar tekrar çalıştırılabiliyor.

---

## Rol sistemi

Sen "takıma birini eklerken sadece admin/manager/viewer çıkıyor, operations
manager yok" dediğinde ortaya yarım kalmış bir tasarım çıktı. Veritabanında altı
rol tanımlıydı ama:

- Hiçbirine tek bir izin bile atanmamıştı.
- Kod bu tabloları hiç okumuyordu.
- Arayüzdeki üç seçenek koda sabit yazılmıştı.
- Rol Yönetimi ekranı vardı ve oradan izin atayabiliyordun ama attığın izinlerin
  hiçbir etkisi yoktu.

Tam çözümü uyguladık:

- İzin kataloğu 6 modülden 16 modüle çıkarıldı, 20 izinden 60 izne. Her role
  modül bazında yetki atandı — toplam 219 rol-izin bağı.
- `lib/authz.ts` veritabanından okuyacak şekilde yeniden yazıldı. Artık yeni rol
  eklemek için kod değişikliği gerekmiyor.
- Mevcut 48 servis hiç değişmeden çalışmaya devam etti; eski API korundu.
- Arayüzdeki üç açılır liste de veritabanından besleniyor.

Sonra iki bug daha çıktı ve onları da düzelttik:

- **Rol güncelleme hiç çalışmıyordu.** Arayüz `roleId` gönderiyordu, servis `role`
  bekliyordu. Alan adları tutmadığı için güncelleme bloğu hiç çalışmıyor, üstelik
  arayüz hatayı sessizce yutuyordu. Senin yaşadığın "admin yaptım ama viewer
  kaldı" sorunu buydu.
- **Yeni oluşturulan roller listede görünmüyordu.** Rol oluşturulurken `slug`
  üretilmiyordu ve atama listesi slug'ı olmayan rolleri gizliyordu. Senin
  eklediğin "Account Manager" rolü de böyle kaybolmuştu, onarıldı.

---

## Kapsamlı test aşaması

Son aşamada iki bölümlü, gerçek bir test yapıldı. Sahte kontroller değil, canlı
uygulamaya HTTP isteği atan testler.

### Birinci bölüm — özellikler gerçekten çalışıyor mu

**Duman testi:** Parametresiz 62 GET servisinin tamamı yetkili bir oturumla
çağrıldı. Dört tanesi 500 hatası veriyordu:

- Süresi dolan sertifikalar listesi — geçersiz tarih işlemi
- Sertifika raporu — sorguya string birleştirme, ayrıca enjeksiyon riski
- Banka bakiyeleri — var olmayan bir sütun sorgulanıyordu
- Giriş geçmişi — sütun adı yanlıştı (`last_activity` yerine `last_active`)

Dördü de düzeltildi.

**CRUD yaşam döngüsü:** Şirket, filo, gemi, fixture, sefer, fatura, departman
zinciri baştan sona kuruldu, okundu, güncellendi ve silindi. Çıkanlar:

- Filo listesi eksik veri gösteriyordu — kod `LIMIT 1` ile rastgele tek bir şirket
  seçiyordu, birden fazla şirketi olan kullanıcı diğerlerini göremiyordu.
- Gemi ve sefer güncelleme 500 veriyordu. Sebebi sürücü değişiminin yan etkisiydi:
  yeni sürücü `undefined` değerleri reddediyor, eskisi sessizce `NULL`'a
  çeviriyordu. Aynı risk **89 satırda** vardı. Tek tek yamalamak yerine
  `lib/db.ts` sarmalayıcısında tek noktada çözdük.
- Tekil fixture görüntüleme servisi hiç yazılmamıştı, 405 dönüyordu.

**Yetki testleri:** Senin asıl sorun buydu — "yetki atadığım kişi gerçekten
sadece atadığım yetkileri mi kullanabiliyor?"

Üç ayrı kullanıcı oluşturup farklı rollerle ekibe ekledik ve gerçek istekler attık.
Başlangıçta cevap **hayır**dı. İki sebep vardı:

- **36 servis merkezî yetki katmanını atlıyordu.** Bunlar sadece "şirkete üye mi?"
  diye bakıyor, rol ayrımı yapmıyordu. Yani izleyici (viewer) rolündeki biri bile
  yazma işlemi yapabiliyordu. Ayrıca sadece bir üyelik tablosuna baktıkları için,
  Kullanıcılar ekranından eklenen kişileri hiç tanımıyorlardı.
- **Fatura oluşturmada hiçbir şirket kontrolü yoktu.** Herhangi bir kullanıcı,
  herhangi bir şirket kimliği göndererek fatura yazabiliyordu.

Düzeltmelerden sonra durum şöyle, hepsi test edilerek kanıtlandı:

- İzleyici görüntüleyebiliyor ama düzenleyemiyor, silemiyor, fatura oluşturamıyor.
- Finans yöneticisi fatura yönetiyor ama gemi düzenleyemiyor ve silemiyor.
- Teknik yönetici gemi ve sertifika yönetiyor ama faturaya hiç erişemiyor.
- Operasyon yöneticisi sefer ve fixture yönetiyor, faturayı sadece görüyor.

Ayrıca şirketler arası izolasyon da test edildi: B şirketinin yöneticisi,
A şirketinin gemisini, faturasını, seferini göremiyor, değiştiremiyor, silemiyor.
Liste servisleri de A'nın verisini sızdırmıyor.

### İkinci bölüm — güvenlik testleri

Saldırgan gözüyle gerçek denemeler yapıldı.

**En kritik bulgu — SQL enjeksiyonu.** Görevler servisinde filtreler doğrudan
sorgu metnine birleştiriliyordu. Sömürülebilir olduğunu kanıtladık: `?status=x'
OR '1'='1` isteği güvenlik filtresini atlattı. `UNION SELECT` ile kullanıcı
tablosundan şifre hash'i çekme yolu da açıktı. Parametreli sorguya çevrildi ve
bir daha oluşmaması için test eklendi.

**Eksik güvenlik başlıkları.** Uygulamada hiçbiri tanımlı değildi — yani
clickjacking, XSS ve MIME karıştırma korumalarının tamamı kapalıydı. Yedi başlık
eklendi: çerçeveye gömülmeyi engelleyen, içerik güvenlik politikası, tip tahminini
kapatan, referrer sızıntısını önleyen, kamera/mikrofon erişimini kapatan, HTTPS
zorlayan ve teknoloji parmak izini gizleyen.

Denenen ve savunulan saldırılar:

- Oturumsuz erişim — altı servis denendi, hepsi engellendi
- Sahte JWT ile giriş — reddedildi
- İmzasız JWT (`alg:none` saldırısı) — reddedildi
- SQL enjeksiyonu — dört farklı payload, hiçbiri işe yaramadı, tablolar sağlam
- Rastgele kimlikle başkasının kaydını isteme — 403/404
- Kayıt olurken kendine `role: admin` göndermek — yok sayıldı
- İzleyicinin kendini yönetici olarak eklemesi — 403
- Şifre deneme saldırısı — altıncı denemede engellendi
- Kullanıcı numaralandırma — var olan ve olmayan e-posta aynı yanıtı veriyor
- Cron adresini anahtarsız veya yanlış anahtarla çağırmak — 401

**Anahtar saklama** ayrıca denetlendi. `.env` dosyaları git'te izlenmiyor, git
geçmişinde sızıntı yok, kodda gömülü sır yok, sunucu sırları istemciye sızmıyor.
Oturum çerezi `HttpOnly` ve `SameSite` korumalı, üretimde `Secure` de otomatik
devreye giriyor.

---

## Şu anki durum

Rakamlarla nereden nereye:

- Kimlik doğrulaması olmayan servis: 31'den 6'ya (kalanlar zaten açık olması
  gerekenler)
- Kaydın sahibini kontrol etmeyen servis: 32'den 3'e (kalanlar paylaşılan
  referans tabloları, şirket verisi içermiyor)
- Kendi veritabanı bağlantısını kuran dosya: 81'den 0'a
- Merkezî yetki katmanını kullanan servis: 0'dan 67'ye
- Tip hatası: 167'den 0'a
- Sunucu tarafında kişisel veri yazan log: 61'den 0'a
- Otomatik test: 0'dan 234'e

Testlerin dağılımı:

- 82 birim testi — yetki kuralları, şifre politikası, dosya doğrulama, deneme
  sınırı, slug üretimi
- 62 duman testi — bütün GET servisleri
- 18 CRUD testi — tam iş akışı
- 34 yetki testi — rol zorlaması ve şirket izolasyonu
- 38 güvenlik testi — sızma denemeleri

Hepsi geçiyor. Üretim derlemesi de tip kontrolü açıkken sorunsuz tamamlanıyor.

Testleri çalıştırmak için:

    npm run test:all

Bu komut her değişiklikten sonra bütün zinciri doğruluyor. Testlerin gerçekten
koruduğunu da kanıtladık: `authz.ts`'e bilerek eski bir açık geri konuldu, beş
test anında kırmızıya döndü, sonra geri alındı.

---

## Yol boyunca çıkan sürprizler

Rapor edilen açıkları düzeltirken, ilk incelemede görülmeyen ve bir kısmı hiç
çalışmayan özellikler ortaya çıktı. Bunların hepsi üretimde de kırıktı:

- Departmanlar ve gruplar — veritabanı tabloları hiç oluşturulamamıştı
- Yakıt takibi — tablo hiç yaratılmamış, servis onu sorguluyordu
- Sertifika listeleri ve hatırlatmaları — kod olmayan bir alan okuyordu, her
  istekte hata dönüyordu
- Sefer ve fixture istatistikleri — yanlış kimlik doğrulama biçimi bekliyorlardı
- Sefer hesaplayıcı şablonları ve kopyalama — kurulu olmayan bir kütüphane
  kullanıyorlardı
- Excel içe aktarma — doğrulama fonksiyonu yanlış kullanıldığı için her satır
  reddediliyordu; ayrıca var olmayan bir sütuna yazmaya çalışıyordu
- Fatura içe aktarma — var olmayan bir tabloyu sorguluyordu
- Son görüntülenenler ve favoriler — kullanıcı kimliği yanlış okunduğu için
  sorgular hep boş dönüyordu
- Bildirimi okundu işaretleme — hiçbir şey yapmıyor, sadece başarılı diyordu

Hepsi onarıldı ve çalıştığı doğrulandı.

Bir de tehlikeli iki durum vardı: sefer hesaplayıcının kurulum adresleri kimlik
doğrulaması olmadan veritabanı tablosu oluşturabiliyordu, ve hatırlatma e-postası
gönderen adres korumasızdı — internetteki herkes tetikleyip tüm şirketlere toplu
e-posta gönderebilirdi. İkisi de kapatıldı.

---

## Sunucuya geçmeden önce yapılması gerekenler

Bunlar mutlaka yapılmalı:

1. Üretim için yeni anahtarlar üretin, yereldekileri taşımayın:
   `openssl rand -hex 48` (JWT_SECRET), `openssl rand -hex 32` (CRON_SECRET)
2. `NODE_ENV=production` ayarlayın. Güvenli çerez ve HTTPS zorlaması bunun
   üzerinden devreye giriyor.
3. HTTPS kurun ve HTTP'yi ona yönlendirin.
4. Veritabanı kullanıcısını kısıtlayın. Uygulama tablo oluşturma/silme yetkisi
   olan bir hesapla bağlanmamalı.
5. Veritabanını dışarıya kapatın, sadece uygulama sunucusundan erişilsin.
6. Dosya yükleme hâlâ Vercel Blob kullanıyor, kendi sunucunuzda çalışmaz. Sunucu
   diskine ya da S3 uyumlu bir depolamaya taşınmalı. Ayrıca yüklenen dosyalar şu
   an herkese açık adreste duruyor, bu da kapatılmalı.

Bunlar da önerilir:

7. Günlük otomatik yedekleme kurun ve geri yüklemeyi bir kez deneyin. Denenmemiş
   yedek, yedek sayılmaz.
8. Oturum süresi 7 gün, hassas veri için uzun. 24 saate indirip yenileme
   mekanizması eklenebilir.
9. Deneme sınırı sadece giriş ekranında var. Sunucu düzeyinde (nginx gibi) genel
   bir istek sınırı eklenmeli.
10. Denetim kaydı var ama bütün yazma işlemlerini kapsamıyor, özellikle finansal
    işlemler için genişletilmeli.
11. `npm audit` düzenli çalıştırılmalı.
12. 5xx ve 429 artışları için uyarı kurun. 429 artışı saldırı göstergesidir.
13. Yayına geçmeden önce bağımsız bir sızma testi yaptırın. Bu çalışma kod
    incelemesi ve otomatik teste dayanıyor; profesyonel bir pentest farklı şeyler
    bulabilir.

---

## Bilinen eksikler

Dürüst olmak gerekirse tamamlanmamış birkaç şey var:

- Sefer hesaplayıcıdaki otomatik mesafe hesaplama çalışmıyor, çünkü çağırdığı
  `/api/datalastic/distance` adresi projede hiç yok. Mesafe elle girilebiliyor.
- Yüklenen dosyalar hâlâ herkese açık adreste. Adresler tahmin edilemez hale
  getirildi ama tam koruma için depolama değişikliği gerekiyor.
- Üç servis paylaşılan referans tablolarına (liman listesi, izin kataloğu,
  sertifika gereklilikleri) sahiplik kontrolü yapmıyor. Bunlar şirket verisi
  içermediği için risk düşük.
- E-posta gönderimi kodda hazır ama gerçek bir servise bağlı değil.
