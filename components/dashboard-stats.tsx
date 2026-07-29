import { Building2, Anchor, FileText, DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStatsProps {
  stats: {
    totalCompanies: number
    totalFleets: number
    totalShips: number
    activeShips: number
    activeFixtures: number
    totalVoyages: number
    activeVoyages: number
    totalInvoices: number
    pendingInvoices: number
    totalRevenue: number
    totalExpense: number
    netProfit: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Toplam Şirket",
      value: stats.totalCompanies,
      icon: Building2,
      description: "Kayıtlı şirket sayısı",
      color: "text-blue-600",
    },
    {
      title: "Aktif Gemiler",
      value: `${stats.activeShips}/${stats.totalShips}`,
      icon: Anchor,
      description: "Operasyondaki gemiler",
      color: "text-cyan-600",
    },
    {
      title: "Aktif Fixture",
      value: stats.activeFixtures,
      icon: FileText,
      description: "Devam eden anlaşmalar",
      color: "text-purple-600",
    },
    {
      title: "Aktif Seferler",
      value: `${stats.activeVoyages}/${stats.totalVoyages}`,
      icon: Activity,
      description: "Devam eden seferler",
      color: "text-orange-600",
    },
    {
      title: "Toplam Gelir",
      value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      description: "Toplam fatura geliri",
      color: "text-green-600",
    },
    {
      title: "Toplam Gider",
      value: `$${(stats.totalExpense / 1000).toFixed(1)}K`,
      icon: TrendingDown,
      description: "Toplam fatura gideri",
      color: "text-red-600",
    },
    {
      title: "Net Kar",
      value: `$${(stats.netProfit / 1000).toFixed(1)}K`,
      icon: DollarSign,
      description: "Gelir - Gider",
      color: stats.netProfit >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Bekleyen Faturalar",
      value: stats.pendingInvoices,
      icon: FileText,
      description: "Ödeme bekleyen",
      color: "text-yellow-600",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="group hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-muted/50 ${stat.color} transition-colors`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
