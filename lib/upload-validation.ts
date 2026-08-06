/**
 * SUNUCU TARAFI dosya yükleme doğrulaması.
 *
 * lib/file-validation.ts tarayıcıda çalışır ve yalnızca kullanıcıya hızlı
 * geri bildirim vermek içindir; saldırgan onu kolayca baypas eder.
 * Yükleme uç noktaları bu modülü kullanmak ZORUNDADIR.
 */

/** Yükleme türüne göre kural setleri. */
export const UPLOAD_RULES = {
  document: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    extensions: ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx", "xls", "xlsx"],
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: ["jpg", "jpeg", "png", "webp"],
  },
  signature: {
    maxSize: 2 * 1024 * 1024, // 2 MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: ["jpg", "jpeg", "png", "webp"],
  },
} as const

export type UploadKind = keyof typeof UPLOAD_RULES

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UploadValidationError"
  }
}

function getExtension(filename: string): string {
  const parts = filename.split(".")
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ""
}

/**
 * Dosya adını güvenli hale getirir.
 *
 * Ham dosya adı doğrudan depolama yoluna yazılırsa:
 *  - "../" içeren adlar yol dışına taşabilir,
 *  - aynı adı yükleyen iki kullanıcıdan biri diğerinin dosyasını ezebilir.
 * Bu yüzden yalnızca güvenli karakterler bırakılır ve uzunluk sınırlanır.
 */
export function sanitizeFilename(filename: string): string {
  const extension = getExtension(filename)
  const base = filename
    .slice(0, filename.length - (extension ? extension.length + 1 : 0))
    .replace(/[^a-zA-Z0-9-_]/g, "-") // tehlikeli karakterleri sadeleştir
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)

  const safeBase = base.length > 0 ? base : "dosya"
  return extension ? `${safeBase}.${extension}` : safeBase
}

/**
 * Dosyayı kurallara göre doğrular. Geçersizse UploadValidationError fırlatır.
 *
 * Hem MIME türü hem uzantı kontrol edilir: MIME türü istemci tarafından
 * gönderildiği için tek başına güvenilmez.
 */
export function validateUpload(file: File, kind: UploadKind): void {
  const rules = UPLOAD_RULES[kind]

  if (!file || typeof file.size !== "number") {
    throw new UploadValidationError("Geçerli bir dosya gönderilmedi")
  }

  if (file.size === 0) {
    throw new UploadValidationError("Dosya boş")
  }

  if (file.size > rules.maxSize) {
    const limitMb = Math.round(rules.maxSize / (1024 * 1024))
    throw new UploadValidationError(`Dosya çok büyük. En fazla ${limitMb} MB olabilir.`)
  }

  const extension = getExtension(file.name)
  const extensionOk = (rules.extensions as readonly string[]).includes(extension)
  const mimeOk = (rules.mimeTypes as readonly string[]).includes(file.type)

  // İkisi de geçerli olmalı; biri uyuyor diğeri uymuyorsa dosya şüphelidir
  // (ör. .exe dosyasına image/png MIME türü verilmesi).
  if (!extensionOk || !mimeOk) {
    throw new UploadValidationError(
      `Desteklenmeyen dosya türü. İzin verilenler: ${rules.extensions.join(", ")}`,
    )
  }
}

/**
 * Depolamada kullanılacak, çakışmayan ve tahmin edilemez bir yol üretir.
 * Kullanıcı kimliği yola dahil edilir ki dosyalar kullanıcı bazında ayrışsın.
 */
export function buildBlobPath(folder: string, userId: string, filename: string): string {
  return `${folder}/${userId}/${Date.now()}-${sanitizeFilename(filename)}`
}
