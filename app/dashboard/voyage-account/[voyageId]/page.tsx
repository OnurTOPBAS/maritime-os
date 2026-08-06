import { VoyageAccountDetail } from "@/components/voyage-account-detail"

export default async function VoyageAccountPage({
  params,
}: {
  params: Promise<{ voyageId: string }>
}) {
  const { voyageId } = await params

  return <VoyageAccountDetail voyageId={voyageId} />
}
