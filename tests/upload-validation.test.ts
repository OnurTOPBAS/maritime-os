import { describe, it, expect } from "vitest"
import {
  validateUpload,
  sanitizeFilename,
  buildBlobPath,
  UploadValidationError,
} from "@/lib/upload-validation"

/** Test için sahte File nesnesi (Node ortamında gerçek File gerekmez). */
function sahteDosya(name: string, type: string, size: number): File {
  return { name, type, size } as File
}

describe("dosya yükleme doğrulaması", () => {
  it("geçerli PDF'i kabul eder", () => {
    expect(() =>
      validateUpload(sahteDosya("fatura.pdf", "application/pdf", 5000), "document"),
    ).not.toThrow()
  })

  it("çalıştırılabilir dosyayı reddeder", () => {
    expect(() =>
      validateUpload(sahteDosya("kotu.exe", "application/x-msdownload", 1000), "document"),
    ).toThrow(UploadValidationError)
  })

  it("uzantısı gizlenmiş dosyayı reddeder (MIME sahte)", () => {
    // Saldırgan .exe dosyasına PDF MIME türü verirse uzantı kontrolü yakalar
    expect(() =>
      validateUpload(sahteDosya("virus.exe", "application/pdf", 1000), "document"),
    ).toThrow(UploadValidationError)
  })

  it("MIME türü uymayan dosyayı reddeder (uzantı doğru)", () => {
    expect(() =>
      validateUpload(sahteDosya("belge.pdf", "application/x-msdownload", 1000), "document"),
    ).toThrow(UploadValidationError)
  })

  it("boyut sınırını aşan dosyayı reddeder", () => {
    expect(() =>
      validateUpload(sahteDosya("buyuk.pdf", "application/pdf", 20 * 1024 * 1024), "document"),
    ).toThrow(/çok büyük/i)
  })

  it("boş dosyayı reddeder", () => {
    expect(() => validateUpload(sahteDosya("bos.pdf", "application/pdf", 0), "document")).toThrow(
      /boş/i,
    )
  })

  it("imza yüklemede SVG'yi reddeder (betik çalıştırabilir)", () => {
    expect(() =>
      validateUpload(sahteDosya("imza.svg", "image/svg+xml", 1000), "signature"),
    ).toThrow(UploadValidationError)
  })

  it("imza yüklemede PNG'yi kabul eder", () => {
    expect(() =>
      validateUpload(sahteDosya("imza.png", "image/png", 1000), "signature"),
    ).not.toThrow()
  })

  it("imza için daha düşük boyut sınırı uygular", () => {
    // 3 MB: image (5MB) için geçerli, signature (2MB) için değil
    const dosya = sahteDosya("imza.png", "image/png", 3 * 1024 * 1024)
    expect(() => validateUpload(dosya, "image")).not.toThrow()
    expect(() => validateUpload(dosya, "signature")).toThrow(/çok büyük/i)
  })
})

describe("dosya adı temizleme", () => {
  it("yol geçişi denemesini etkisiz hale getirir", () => {
    const temiz = sanitizeFilename("../../etc/passwd.pdf")
    expect(temiz).not.toContain("..")
    expect(temiz).not.toContain("/")
    expect(temiz.endsWith(".pdf")).toBe(true)
  })

  it("betik enjeksiyonu karakterlerini temizler", () => {
    const temiz = sanitizeFilename("<script>alert(1)</script>.png")
    expect(temiz).not.toContain("<")
    expect(temiz).not.toContain(">")
  })

  it("uzantıyı korur", () => {
    expect(sanitizeFilename("normal dosya.pdf")).toBe("normal-dosya.pdf")
  })

  it("adı tamamen temizlenen dosyaya varsayılan ad verir", () => {
    expect(sanitizeFilename("###.pdf")).toBe("dosya.pdf")
  })

  it("çok uzun adı kısaltır", () => {
    const temiz = sanitizeFilename("a".repeat(300) + ".pdf")
    expect(temiz.length).toBeLessThanOrEqual(85)
  })
})

describe("depolama yolu üretimi", () => {
  it("kullanıcı kimliğini yola dahil eder", () => {
    const yol = buildBlobPath("documents", "kullanici-123", "rapor.pdf")
    expect(yol).toContain("documents/")
    expect(yol).toContain("kullanici-123")
    expect(yol.endsWith("rapor.pdf")).toBe(true)
  })

  it("aynı dosya adı için farklı yollar üretir (üzerine yazmayı önler)", async () => {
    const a = buildBlobPath("documents", "u1", "rapor.pdf")
    await new Promise((r) => setTimeout(r, 2))
    const b = buildBlobPath("documents", "u2", "rapor.pdf")
    expect(a).not.toBe(b)
  })
})
