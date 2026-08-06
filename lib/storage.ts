/**
 * Yerel dosya depolama.
 *
 * Yüklenen dosyalar Vercel Blob yerine SUNUCUNUN DİSKİNDE tutulur; böylece
 * hiçbir veri dışarı çıkmaz (gizlilik hedefi). Dosyalar public klasörünün
 * DIŞINDA saklanır ve yalnızca kimlik doğrulamalı `/api/files/...` rotası
 * üzerinden sunulur — yani doğrudan URL ile internete açık değildir.
 *
 * Depolama konumu UPLOAD_DIR ortam değişkeniyle belirlenir. Tanımlı değilse
 * proje kökündeki `var/uploads` kullanılır (bu klasör git'e girmez).
 */

import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

/** Dosyaların diskte tutulduğu kök dizin. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "var", "uploads")

/** Depolama anahtarı (storageKey) -> sunulan URL. */
export function keyToUrl(key: string): string {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`
}

/** Sunulan URL -> depolama anahtarı. `/api/files/...` biçimini çözer. */
export function urlToKey(url: string): string | null {
  const marker = "/api/files/"
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url
    .slice(idx + marker.length)
    .split("/")
    .map((s) => decodeURIComponent(s))
    .join("/")
}

/**
 * Dosya adını güvenli hale getirir (yol geçişi ve tehlikeli karakterler).
 * lib/upload-validation.ts ile aynı mantık; depolama katmanı bağımsız çalışsın
 * diye burada da bulunur.
 */
function sanitizeFilename(filename: string): string {
  const dot = filename.lastIndexOf(".")
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : ""
  const base = (dot > 0 ? filename.slice(0, dot) : filename)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
  const safeBase = base.length ? base : "dosya"
  return ext ? `${safeBase}.${ext}` : safeBase
}

/** Bir depolama anahtarının UPLOAD_DIR içindeki mutlak yolunu güvenle çözer. */
function resolveKeyPath(key: string): string {
  const full = path.resolve(UPLOAD_DIR, key)
  // Yol geçişi koruması: çözülen yol UPLOAD_DIR dışına çıkamaz.
  if (full !== UPLOAD_DIR && !full.startsWith(UPLOAD_DIR + path.sep)) {
    throw new Error("Geçersiz dosya yolu")
  }
  return full
}

export interface SavedFile {
  /** Diskteki göreli anahtar; veritabanına bunun URL'i yazılır. */
  key: string
  /** İstemcinin kullanacağı, kimlik doğrulamalı erişim adresi. */
  url: string
  size: number
  type: string
}

/**
 * Bir File'ı diske yazar.
 *
 * @param folder mantıksal klasör (documents, signatures, profile-photos ...)
 * @param userId yükleyen kullanıcı — yol kullanıcı bazında ayrışır
 */
export async function saveFile(folder: string, userId: string, file: File): Promise<SavedFile> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const rand = crypto.randomBytes(6).toString("hex")
  const key = `${folder}/${userId}/${Date.now()}-${rand}-${sanitizeFilename(file.name)}`
  const full = resolveKeyPath(key)

  await fs.mkdir(path.dirname(full), { recursive: true })
  await fs.writeFile(full, buffer)

  return { key, url: keyToUrl(key), size: file.size, type: file.type }
}

/** Diskten dosya siler. URL veya depolama anahtarı kabul eder. */
export async function deleteFile(urlOrKey: string): Promise<void> {
  const key = urlOrKey.includes("/api/files/") ? urlToKey(urlOrKey) : urlOrKey
  if (!key) return
  try {
    await fs.unlink(resolveKeyPath(key))
  } catch (error: any) {
    // Dosya zaten yoksa sorun değil.
    if (error?.code !== "ENOENT") throw error
  }
}

/** Uzantıdan MIME türü tahmini (sunulan dosyanın Content-Type'ı için). */
const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
}

export function contentTypeForKey(key: string): string {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase()
  return MIME_BY_EXT[ext] ?? "application/octet-stream"
}

/**
 * Sunum için dosyayı belleğe okur. Dosya yoksa VEYA yol geçersizse (yol geçişi
 * denemesi) null döner — bu durumda çağıran 404 döndürmelidir.
 */
export async function readFileBuffer(
  key: string,
): Promise<{ buffer: Buffer; type: string } | null> {
  let full: string
  try {
    full = resolveKeyPath(key)
  } catch {
    return null // yol geçişi denemesi: kaydı yokmuş gibi ele al
  }
  if (!existsSync(full)) return null
  return { buffer: await fs.readFile(full), type: contentTypeForKey(key) }
}
