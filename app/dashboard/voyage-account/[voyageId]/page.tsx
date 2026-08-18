import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { VoyageAccountDetail } from "@/components/voyage-account-detail"

export default async function VoyageAccountPage({
  params,
}: {
  params: Promise<{ voyageId: string }>
}) {
  const user = await requireAuth()
  await guardPage(user.id, "voyage_account")
  const { voyageId } = await params

  return <VoyageAccountDetail voyageId={voyageId} />
}
