"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function AcceptInvitationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError("Geçersiz davet linki")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      })

      const data = await response.json().catch(() => ({} as any))

      if (response.ok) {
        setMessage(data.message)
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
      } else {
        setError(data.error || "Davet kabul edilemedi")
      }
    } catch (err) {
      setError("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Daveti Kabul Et</CardTitle>
          <CardDescription>Hesabınızı oluşturun ve şirkete katılın.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">İsim</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
                required
                disabled={!token}
              />
            </div>

            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                required
                disabled={!token}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrenizi tekrar girin"
                required
                disabled={!token}
              />
            </div>

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">{message}</div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? "Kaydediliyor..." : "Daveti Kabul Et"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <AcceptInvitationForm />
    </Suspense>
  )
}
