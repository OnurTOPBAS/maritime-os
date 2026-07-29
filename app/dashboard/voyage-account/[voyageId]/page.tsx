import { VoyageAccountDetail } from "@/components/voyage-account-detail"

export default function VoyageAccountPage({ params }: { params: { voyageId: string } }) {
  return <VoyageAccountDetail voyageId={params.voyageId} />
}
