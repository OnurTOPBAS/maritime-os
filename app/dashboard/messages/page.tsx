import { requireAuth } from "@/lib/session"
import { guardPage } from "@/lib/page-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MessagingCenter } from "@/components/messaging-center"
import { NotificationCenter } from "@/components/notification-center"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function MessagesPage() {
  const user = await requireAuth()

  await guardPage(user.id, "messages")
  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">İletişim Merkezi</h1>
        <Tabs defaultValue="messages" className="w-full">
          <TabsList>
            <TabsTrigger value="messages">Mesajlar</TabsTrigger>
            <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          </TabsList>
          <TabsContent value="messages" className="mt-6">
            <MessagingCenter />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
