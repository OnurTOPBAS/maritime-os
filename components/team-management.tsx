"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Trash2, UserPlus, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TeamMember {
  id: string
  user_id: string
  name: string
  email: string
  image?: string
  role: string
  added_by_name?: string
  created_at: string
}

interface AvailableUser {
  id: string
  name: string
  email: string
  image?: string
  role: string
}

interface Invitation {
  id: string
  email: string
  role: string
  invited_by_name: string
  created_at: string
  expires: string
}

interface TeamManagementProps {
  companyId: string
}

export function TeamManagement({ companyId }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState("viewer")
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    role: "viewer",
  })
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadTeamMembers(), loadAvailableUsers(), loadInvitations()])
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/team`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/users/available?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading available users:", error)
    }
  }

  const loadInvitations = async () => {
    try {
      const response = await fetch(`/api/invitations?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading invitations:", error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    try {
      const response = await fetch(`/api/companies/${companyId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      })

      if (response.ok) {
        setIsAddMemberDialogOpen(false)
        setSelectedUserId("")
        setSelectedRole("viewer")
        loadData()
      } else {
        const data = await response.json()
        alert(data.error || "Takım üyesi eklenemedi")
      }
    } catch (error) {
      console.error("Error adding team member:", error)
      alert("Takım üyesi eklenemedi")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Bu kullanıcıyı takımdan çıkarmak istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/companies/${companyId}/team/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error("Error removing team member:", error)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/team/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        loadTeamMembers()
      }
    } catch (error) {
      console.error("Error updating role:", error)
    }
  }

  const handleInviteUser = async () => {
    try {
      setMessage("")
      setError("")
      setInviteLink("")

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inviteFormData, companyId }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.emailSent) {
          setMessage("Davet başarıyla gönderildi ve email ile iletildi")
        } else if (data.emailError) {
          setMessage("Davet oluşturuldu ancak email gönderilemedi. Aşağıdaki linki manuel olarak paylaşabilirsiniz:")
          setInviteLink(data.inviteLink)
        } else {
          setMessage("Davet oluşturuldu. Email servisi yapılandırılmamış, linki manuel olarak paylaşın:")
          setInviteLink(data.inviteLink)
        }

        setInviteFormData({ email: "", role: "viewer" })
        loadInvitations()

        if (!data.emailSent) {
        } else {
          setIsInviteDialogOpen(false)
        }
      } else {
        const data = await response.json()
        setError(data.error || "Davet gönderilemedi")
      }
    } catch (error) {
      console.error("Error inviting user:", error)
      setError("Davet gönderilemedi")
    }
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Bu daveti iptal etmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/invitations/${invitationId}?companyId=${companyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadInvitations()
      }
    } catch (error) {
      console.error("Error deleting invitation:", error)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Takım Üyeleri ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="mr-2 h-4 w-4" />
            Bekleyen Davetler ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Takım Üyeleri</h3>
              <p className="text-sm text-muted-foreground">Şirketinize kayıtlı kullanıcılar</p>
            </div>
            <Button onClick={() => setIsAddMemberDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Üye Ekle
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Ekleyen</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Henüz takım üyesi yok
                    </TableCell>
                  </TableRow>
                ) : (
                  teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.image || "/placeholder.svg"} />
                            <AvatarFallback>{member.name?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Select value={member.role} onValueChange={(value) => handleUpdateRole(member.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{member.added_by_name || "-"}</TableCell>
                      <TableCell>{new Date(member.created_at).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Bekleyen Davetler</h3>
              <p className="text-sm text-muted-foreground">Şirketinize davet edilen kullanıcılar</p>
            </div>
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Kullanıcı Davet Et
            </Button>
          </div>

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">{message}</div>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">{error}</div>}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Davet Eden</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Geçerlilik</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Bekleyen davet yok
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{invitation.role}</Badge>
                      </TableCell>
                      <TableCell>{invitation.invited_by_name}</TableCell>
                      <TableCell>{new Date(invitation.created_at).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>{new Date(invitation.expires).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInvitation(invitation.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takım Üyesi Ekle</DialogTitle>
            <DialogDescription>Sistemde kayıtlı bir kullanıcıyı şirketinize ekleyin.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Kullanıcı</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role-select">Rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Davet Et</DialogTitle>
            <DialogDescription>
              Şirketinize yeni bir kullanıcı davet edin. Davet linki email ile gönderilecek.
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">{message}</div>
          )}

          {inviteLink && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <p className="text-sm font-medium text-blue-900">Davet Linki:</p>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink)
                    alert("Link kopyalandı!")
                  }}
                >
                  Kopyala
                </Button>
              </div>
              <p className="text-xs text-blue-700">
                Bu linki davet etmek istediğiniz kişiye manuel olarak gönderebilirsiniz.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                placeholder="kullanici@email.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Rol</Label>
              <Select
                value={inviteFormData.role}
                onValueChange={(value) => setInviteFormData({ ...inviteFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsInviteDialogOpen(false)
                setMessage("")
                setInviteLink("")
              }}
            >
              {inviteLink ? "Kapat" : "İptal"}
            </Button>
            {!inviteLink && <Button onClick={handleInviteUser}>Davet Gönder</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
