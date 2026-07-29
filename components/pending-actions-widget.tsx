import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, Calendar } from "lucide-react"
import Link from "next/link"

interface PendingActionsWidgetProps {
  pendingInvoices: number
  upcomingLaycans: number
  expiringSoon: number
}

export function PendingActionsWidget({ pendingInvoices, upcomingLaycans, expiringSoon }: PendingActionsWidgetProps) {
  const actions = [
    {
      id: "invoices",
      title: "Bekleyen Faturalar",
      count: pendingInvoices,
      icon: FileText,
      href: "/dashboard/invoices?status=pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      id: "laycans",
      title: "Yaklaşan Laycan'lar",
      count: upcomingLaycans,
      icon: Calendar,
      href: "/dashboard/fixtures",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "expiring",
      title: "Süresi Dolacak Belgeler",
      count: expiringSoon,
      icon: AlertCircle,
      href: "/dashboard/documents",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  const totalPending = pendingInvoices + upcomingLaycans + expiringSoon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Bekleyen İşlemler
        </CardTitle>
        <CardDescription>Dikkat gerektiren konular</CardDescription>
      </CardHeader>
      <CardContent>
        {totalPending > 0 ? (
          <div className="space-y-2">
            {actions.map((action) => {
              if (action.count === 0) return null
              const Icon = action.icon
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 hover:border-primary/20 transition-all group"
                >
                  <div className={`p-2.5 rounded-lg ${action.bgColor} transition-transform group-hover:scale-110`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground">İşlem bekliyor</p>
                  </div>
                  <Badge variant="secondary" className="text-sm font-bold">
                    {action.count}
                  </Badge>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 w-fit mx-auto mb-3">
              <AlertCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium mb-1">Harika!</p>
            <p className="text-xs text-muted-foreground">Bekleyen işlem bulunmuyor</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
