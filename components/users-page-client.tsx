"use client"

import { useState } from "react"
import { UserManagement } from "@/components/user-management"
import { TeamManagement } from "@/components/team-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"

interface Company {
  id: string
  name: string
}

export function UsersPageClient({ companies }: { companies: Company[] }) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "")

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">
            Seçili şirketin kullanıcılarını yönetin, ekleyin veya davet gönderin.
          </p>
        </div>

        {/* Şirket seçici — yalnızca erişebildiğin şirketler listelenir */}
        <div className="space-y-1 min-w-[240px]">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> Şirket
          </Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Şirket seçin" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="invitations">Davetler</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {/* key: şirket değişince bileşen sıfırdan yüklenir */}
          <UserManagement key={companyId} companyId={companyId} />
        </TabsContent>

        <TabsContent value="invitations">
          <TeamManagement key={companyId} companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
