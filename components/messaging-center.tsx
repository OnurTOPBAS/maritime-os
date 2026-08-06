"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquare,
  Send,
  Users,
  Plus,
  Search,
  Paperclip,
  Reply,
  Smile,
  File,
  ImageIcon,
  Download,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  sender_id: string
  sender_name: string
  sender_email: string
  recipient_id?: string
  conversation_id?: string
  subject?: string
  body: string
  is_read: boolean
  created_at: string
  is_edited?: boolean
  attachments?: string
  thread_id?: string
}

interface Conversation {
  id: string
  name?: string
  type: string
  participant_count: number
  unread_count: number
  last_message_at?: string
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
  status?: string
}

const safeJsonParse = (jsonString: any, fallback: any = []) => {
  // If it's already an object or array, return it
  if (typeof jsonString === "object" && jsonString !== null) {
    return jsonString
  }

  // If it's not a string, return fallback
  if (typeof jsonString !== "string") {
    return fallback
  }

  // Now we know it's a string, safe to call .trim()
  if (!jsonString || jsonString.trim() === "") {
    return fallback
  }

  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("[v0] Error parsing JSON:", error, "Input:", jsonString)
    return fallback
  }
}

export function MessagingCenter() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [newMessageRecipient, setNewMessageRecipient] = useState("")
  const [newConversationName, setNewConversationName] = useState("")
  const [newConversationParticipants, setNewConversationParticipants] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [typingUsers, setTypingUsers] = useState<any[]>([])
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    loadConversations()
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      console.log("[v0] Loading conversations...")
      const response = await fetch("/api/conversations")
      if (!response.ok) {
        console.error("[v0] Failed to fetch conversations:", response.status)
        return
      }

      const text = await response.text()
      if (!text) {
        console.log("[v0] Empty response from conversations API")
        setConversations([])
        return
      }

      const data = JSON.parse(text)
      console.log("[v0] Conversations loaded:", data.conversations?.length || 0)
      setConversations(data.conversations || [])
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
      setConversations([])
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      console.log("[v0] Loading messages for conversation:", conversationId)
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (!response.ok) {
        console.error("[v0] Failed to fetch messages:", response.status)
        return
      }

      const text = await response.text()
      if (!text) {
        console.log("[v0] Empty response from messages API")
        setMessages([])
        return
      }

      const data = JSON.parse(text)
      console.log("[v0] Messages loaded:", data.messages?.length || 0)
      setMessages(data.messages || [])
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
      setMessages([])
    }
  }

  const loadUsers = async () => {
    try {
      console.log("[v0] Loading team members for messaging...")
      const response = await fetch("/api/team-members")

      if (!response.ok) {
        console.error("[v0] Failed to fetch team members:", response.status)
        setUsers([])
        return
      }

      const text = await response.text()
      if (!text) {
        console.log("[v0] Empty response from team members API")
        setUsers([])
        return
      }

      const data = JSON.parse(text)
      console.log("[v0] Team members loaded:", data.users?.length || 0)
      setUsers(data.users || [])
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      setUsers([])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation,
          recipientId: newMessageRecipient || null,
          body: newMessage,
          attachments,
          threadId: replyingTo?.id || null,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        setAttachments([])
        setReplyingTo(null)
        if (selectedConversation) {
          loadMessages(selectedConversation)
        }
        loadConversations()
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async () => {
    if (newConversationParticipants.length === 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newConversationName,
          type: newConversationParticipants.length === 1 ? "direct" : "group",
          participantIds: newConversationParticipants,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewConversationName("")
        setNewConversationParticipants([])
        loadConversations()
        setSelectedConversation(data.conversation.id)
      }
    } catch (error) {
      console.error("[v0] Error creating conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/messages/attachments", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          setAttachments([...attachments, data])
        } else {
          console.error("[v0] Unexpected response type:", contentType)
        }
      } else {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json()
          console.error("[v0] File upload failed:", error)
        } else {
          console.error("[v0] File upload failed with status:", response.status)
        }
      }
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleTyping = () => {
    if (!selectedConversation) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing indicator
    fetch(`/api/conversations/${selectedConversation}/typing`, {
      method: "POST",
    })

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 3000)
  }

  useEffect(() => {
    if (!selectedConversation) {
      setTypingUsers([])
      return
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/conversations/${selectedConversation}/typing`)
        if (!response.ok) {
          if (response.status === 429) {
            console.log("[v0] Rate limited on typing indicators, backing off...")
          }
          setTypingUsers([])
          return
        }

        const text = await response.text()
        if (!text) {
          setTypingUsers([])
          return
        }

        try {
          const data = JSON.parse(text)
          setTypingUsers(data.typing || [])
        } catch (parseError) {
          console.log("[v0] Non-JSON response from typing indicators, likely rate limited")
          setTypingUsers([])
        }
      } catch (error) {
        setTypingUsers([])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedConversation])

  const toggleReaction = async (messageId: string, reaction: string) => {
    try {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      })

      if (selectedConversation) {
        loadMessages(selectedConversation)
      }
    } catch (error) {
      console.error("[v0] Error toggling reaction:", error)
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mesajlar
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Sohbet</DialogTitle>
                  <DialogDescription>Yeni bir sohbet başlatın veya grup oluşturun</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Sohbet Adı (Opsiyonel)</Label>
                    <Input
                      value={newConversationName}
                      onChange={(e) => setNewConversationName(e.target.value)}
                      placeholder="Grup adı..."
                    />
                  </div>
                  <div>
                    <Label>Katılımcılar</Label>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!newConversationParticipants.includes(value)) {
                          setNewConversationParticipants([...newConversationParticipants, value])
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kullanıcı seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newConversationParticipants.map((participantId) => {
                        const user = users.find((u) => u.id === participantId)
                        return (
                          <Badge key={participantId} variant="secondary">
                            {user?.name}
                            <button
                              onClick={() =>
                                setNewConversationParticipants(
                                  newConversationParticipants.filter((id) => id !== participantId),
                                )
                              }
                              className="ml-1"
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                  <Button onClick={createConversation} disabled={loading || newConversationParticipants.length === 0}>
                    Sohbet Oluştur
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sohbet ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors border-b rounded-md ${
                    selectedConversation === conversation.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium truncate">
                          {conversation.name || `Sohbet ${conversation.participant_count} kişi`}
                        </span>
                      </div>
                      {conversation.last_message_at && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-2 flex-shrink-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col min-h-0">
        {selectedConversation ? (
          <>
            <CardHeader className="flex-shrink-0">
              <CardTitle>Mesajlar</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Messages scroll area - takes available space */}
              <div className="flex-1 overflow-hidden px-4 pt-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {messages.map((message) => {
                      const attachmentsList = safeJsonParse(message.attachments, [])

                      return (
                        <div key={message.id} className="flex gap-3 group">
                          <Avatar className="flex-shrink-0">
                            <AvatarFallback>{message.sender_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{message.sender_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </span>
                              {message.is_edited && <span className="text-xs text-muted-foreground">(düzenlendi)</span>}
                            </div>

                            {message.thread_id && (
                              <div className="text-xs text-muted-foreground mb-1">Yanıtlıyor...</div>
                            )}

                            <p className="text-sm mt-1 break-words">{message.body}</p>

                            {attachmentsList.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {attachmentsList.map((attachment: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 border rounded hover:bg-accent"
                                  >
                                    {attachment.type?.startsWith("image/") ? (
                                      <ImageIcon className="h-4 w-4 flex-shrink-0" />
                                    ) : (
                                      <File className="h-4 w-4 flex-shrink-0" />
                                    )}
                                    <span className="text-sm truncate">{attachment.name}</span>
                                    <Download className="h-3 w-3 ml-auto flex-shrink-0" />
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 opacity-0 group-hover:opacity-100"
                                  >
                                    <Smile className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {["👍", "❤️", "😊", "😂", "😮", "😢", "🎉", "🔥"].map((emoji) => (
                                    <DropdownMenuItem key={emoji} onClick={() => toggleReaction(message.id, emoji)}>
                                      {emoji}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 opacity-0 group-hover:opacity-100"
                                onClick={() => setReplyingTo(message)}
                              >
                                <Reply className="h-3 w-3 mr-1" />
                                Yanıtla
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed bottom section - always visible */}
              <div className="flex-shrink-0 border-t bg-background px-4 py-3 space-y-2">
                {typingUsers.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {typingUsers.map((u) => u.name).join(", ")} yazıyor...
                  </div>
                )}

                {replyingTo && (
                  <div className="flex items-center gap-2 p-2 bg-accent rounded">
                    <Reply className="h-4 w-4" />
                    <div className="flex-1 text-sm truncate">
                      <span className="font-medium">{replyingTo.sender_name}</span> mesajına yanıt
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                      ×
                    </Button>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {attachments.map((attachment, idx) => (
                      <div key={idx} className="relative p-2 border rounded">
                        <span className="text-xs truncate max-w-[100px] block">{attachment.name}</span>
                        <button
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="flex-shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    placeholder="Mesajınızı yazın... (@kullanıcı ile mention yapabilirsiniz)"
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || (!newMessage.trim() && attachments.length === 0)}
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Bir sohbet seçin veya yeni sohbet başlatın</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
