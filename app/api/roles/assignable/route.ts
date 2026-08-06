import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { listAssignableRoles } from "@/lib/authz"
import { handleApiError } from "@/lib/api-error"

/**
 * Ekip üyesine atanabilecek roller.
 *
 * Arayüzdeki rol açılır listeleri bu uç noktayı kullanır. Önceden roller
 * bileşenlerin içine sabit yazılmıştı (admin/manager/viewer); bu yüzden
 * veritabanında tanımlı Operations/Technical/Finance Manager rolleri
 * seçilemiyordu. Artık yeni rol eklemek için kod değişikliği gerekmez.
 */
export async function GET() {
  try {
    await requireAuth()
    return NextResponse.json(await listAssignableRoles())
  } catch (error) {
    return handleApiError(error, "Atanabilir roller")
  }
}
