/**
 * Tek veritabanı erişim noktası.
 *
 * Uygulamanın TAMAMI buradaki `sql` üzerinden sorgu çalıştırır. Rotalar kendi
 * bağlantısını kurmaz; böylece sürücü, havuz ayarı ve günlükleme gibi kararlar
 * tek dosyadan yönetilir (encapsulation).
 *
 * Standart PostgreSQL protokolü kullanılır; bu sayede aynı kod
 * yerel geliştirmede, kiralanan sunucuda ve yönetilen bir Postgres
 * servisinde (Neon dâhil) değişiklik gerekmeden çalışır.
 *
 * Bağlantı adresi DATABASE_URL ortam değişkeninden okunur:
 *   postgres://kullanici:sifre@sunucu:5432/veritabani
 *   (uzak sunucularda genellikle sonuna ?sslmode=require eklenir)
 */

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

/**
 * Bağlantı havuzu.
 *
 * Next.js geliştirme modunda modüller yeniden yüklendiği için havuz
 * globalThis üzerinde saklanır; aksi halde her yeniden derlemede yeni havuz
 * açılır ve veritabanı bağlantıları tükenir.
 */
const globalForDb = globalThis as unknown as { __appPg?: postgres.Sql }

const pg =
  globalForDb.__appPg ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Uzak sunucularda TLS; yerel geliştirmede genellikle yoktur.
    ssl: /sslmode=require|sslmode=verify/.test(connectionString) ? "require" : false,
    onnotice: () => {},
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.__appPg = pg
}

/**
 * Uygulama genelinde kullanılan sorgu arayüzü.
 *
 * İki çağrı biçimini de destekler:
 *   sql`SELECT * FROM users WHERE id = ${id}`   (tercih edilen)
 *   sql("SELECT * FROM users WHERE id = $1", [id])
 *
 * Her iki biçimde de değerler parametre olarak gönderilir; SQL enjeksiyonu
 * riski yoktur. İkinci biçim yalnızca eski kodla uyumluluk içindir.
 */
export interface Sql {
  <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> & postgres.PendingQuery<any>
  <T = any>(query: string, params?: any[]): Promise<T[]>
  /**
   * Parametreleştirilemeyen ifadeler için (ör. şema kurulumu / DDL).
   * Kullanıcı girdisiyle ASLA birleştirilmemelidir.
   */
  unsafe: postgres.Sql["unsafe"]
  /** Alt seviye sürücüye erişim (işlem/transaction, dinleme vb. için). */
  raw: postgres.Sql
}

function isTemplateStrings(value: unknown): value is TemplateStringsArray {
  return Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, "raw")
}

const sqlAdapter = ((first: any, ...rest: any[]) => {
  // Etiketli şablon: sql`... ${değer} ...`
  // Sürücünün Query nesnesi olduğu gibi döndürülür; böylece iç içe
  // parça kullanımı (koşullu WHERE bloğu gibi) çalışmaya devam eder.
  if (isTemplateStrings(first)) {
    // undefined -> null çevrimi.
    // Eski Neon (HTTP) sürücüsü undefined değerleri sessizce NULL'a çevirirdi;
    // `postgres` sürücüsü ise reddeder ("Undefined values are not allowed").
    // Sürücü değişiminin bu farkını tek noktada kapatıyoruz ki isteğe bağlı
    // alanı gönderilmemiş her sorgu (kısmi güncelleme gibi) çökmesin.
    // İç içe sql`` parçaları ve diğer nesneler dokunulmadan geçer.
    const safeValues = rest.map((v) => (v === undefined ? null : v))
    return (pg as any)(first, ...safeValues)
  }

  // Konumsal biçim: sql("... $1 ...", [değer])
  if (typeof first === "string") {
    return pg.unsafe(first, rest[0] ?? [])
  }

  throw new TypeError("sql() etiketli şablon veya (sorgu, parametreler) biçiminde çağrılmalıdır")
}) as unknown as Sql

sqlAdapter.unsafe = pg.unsafe.bind(pg) as postgres.Sql["unsafe"]
sqlAdapter.raw = pg

export const sql = sqlAdapter
