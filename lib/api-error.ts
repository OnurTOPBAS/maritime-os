/**
 * API rotaları için ortak hata dönüştürücü.
 *
 * Amaç: Her rotada tekrar eden try/catch mantığını tek yerde toplamak ve
 * hataları DOĞRU HTTP koduna çevirmek.
 *
 * Önceki durumda pek çok rota her hatayı 401 ya da 500 olarak döndürüyordu;
 * bu hem hata ayıklamayı zorlaştırıyor hem de yetki sorunlarını gizliyordu.
 *
 * Kullanım:
 *   export async function POST(request: Request) {
 *     try {
 *       const user = await requireAuth()
 *       await requireCompanyAccess(user.id, companyId, "canCreate")
 *       ...
 *     } catch (error) {
 *       return handleApiError(error, "Gemi oluşturma")
 *     }
 *   }
 */

import { NextResponse } from "next/server"
import { ForbiddenError, NotFoundError } from "./authz"
import { UnauthorizedError } from "./session"
import { UploadValidationError } from "./upload-validation"
import { PasswordPolicyError } from "./password-policy"
import { RateLimitError } from "./rate-limit"

export function handleApiError(error: unknown, context = "API") {
  // Oturum yok -> 401
  if (error instanceof UnauthorizedError || (error instanceof Error && error.message === "Unauthorized")) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
  }

  // Oturum var ama yetki yok -> 403
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  // Kayıt yok -> 404
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Çok fazla deneme -> 429
  if (error instanceof RateLimitError) {
    return NextResponse.json({ error: error.message }, { status: 429 })
  }

  // Geçersiz dosya / parola politikası -> 400 (mesaj kullanıcıya gösterilebilir)
  if (error instanceof UploadValidationError || error instanceof PasswordPolicyError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Beklenmeyen hata -> 500. Detay yalnızca sunucu log'una yazılır,
  // istemciye iç hata mesajı sızdırılmaz.
  console.error(`[${context}] Beklenmeyen hata:`, error)
  return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
}
