"use client"

import { useRecentItems } from "@/lib/hooks/use-recent-items"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Ship, FileText, Anchor, Building2 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export function RecentItemsWidget() {
  const { recentItems, isLoading } = useRecentItems(8)

  const getIcon = (type: string) => {
    switch (type) {
      case "ship":
        return <Ship className="h-4 w-4" />
      case "fixture":
        return <FileText className="h-4 w-4" />
      case "voyage":
        return <Anchor className="h-4 w-4" />
      case "company":
        return <Building2 className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getUrl = (item: any) => {
    const urls: Record<string, string> = {
      ship: `/dashboard/ships/${item.entity_id}`,
      fixture: `/dashboard/fixtures/${item.entity_id}`,
      voyage: `/dashboard/voyage-account/${item.entity_id}`,
      company: `/dashboard/companies/${item.entity_id}`,
      invoice: `/dashboard/invoices/${item.entity_id}`,
    }
    return urls[item.entity_type] || "#"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Son Görüntülenenler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Son Görüntülenenler
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Henüz görüntülenen öğe yok</p>
        ) : (
          <div className="space-y-1">
            {recentItems.map((item: any) => (
              <Link
                key={item.id}
                href={getUrl(item)}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <div className="text-muted-foreground">{getIcon(item.entity_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.entity_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.viewed_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
