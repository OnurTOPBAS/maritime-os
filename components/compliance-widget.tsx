"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface ComplianceItem {
  category: string
  status: "compliant" | "warning" | "non-compliant"
  description: string
  expiryDate?: string
}

export function ComplianceWidget() {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated compliance data - in production, this would fetch from a compliance API
    const mockItems: ComplianceItem[] = [
      {
        category: "IMO 2020 Sülfür Limiti",
        status: "compliant",
        description: "Tüm gemiler uyumlu yakıt kullanıyor",
      },
      {
        category: "SOLAS Sertifikaları",
        status: "warning",
        description: "2 gemide yenileme gerekiyor",
        expiryDate: "2024-03-15",
      },
      {
        category: "ISM Code Denetimi",
        status: "compliant",
        description: "Son denetim başarılı",
      },
      {
        category: "Balast Suyu Yönetimi",
        status: "compliant",
        description: "BWM Convention uyumlu",
      },
      {
        category: "MLC 2006 Uyumu",
        status: "warning",
        description: "Mürettebat sertifikaları kontrol edilmeli",
        expiryDate: "2024-02-28",
      },
      {
        category: "Çevre Koruma (MARPOL)",
        status: "compliant",
        description: "Tüm Annex'lere uyumlu",
      },
    ]

    setTimeout(() => {
      setItems(mockItems)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="text-lg">Uyum ve Regülasyon</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const compliantCount = items.filter((i) => i.status === "compliant").length
  const warningCount = items.filter((i) => i.status === "warning").length
  const nonCompliantCount = items.filter((i) => i.status === "non-compliant").length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case "non-compliant":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
      case "non-compliant":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      default:
        return ""
    }
  }

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Uyum ve Regülasyon</CardTitle>
            <CardDescription>IMO ve uluslararası düzenlemeler</CardDescription>
          </div>
          <Shield className="h-8 w-8 text-amber-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-center">
            <p className="text-2xl font-bold text-green-600">{compliantCount}</p>
            <p className="text-xs text-green-700 dark:text-green-400">Uyumlu</p>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-center">
            <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">Uyarı</p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-center">
            <p className="text-2xl font-bold text-red-600">{nonCompliantCount}</p>
            <p className="text-xs text-red-700 dark:text-red-400">Uyumsuz</p>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getStatusColor(item.status)}`}>
              <div className="flex items-start gap-2">
                {getStatusIcon(item.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.category}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  {item.expiryDate && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Son tarih: {new Date(item.expiryDate).toLocaleDateString("tr-TR")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
