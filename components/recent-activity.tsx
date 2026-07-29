import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, FileText, Activity } from "lucide-react"

interface Company {
  id: string
  name: string
  created_at: string
}

interface Fixture {
  id: string
  charterer: string
  cargo_type: string | null
  status: string
  created_at: string
}

interface RecentActivityProps {
  companies: Company[]
  fixtures: Fixture[]
}

export function RecentActivity({ companies, fixtures }: RecentActivityProps) {
  const recentCompanies = (companies || []).slice(0, 3)
  const recentFixtures = (fixtures || []).slice(0, 5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Bugün"
    if (diffInDays === 1) return "Dün"
    if (diffInDays < 7) return `${diffInDays} gün önce`
    return date.toLocaleDateString("tr-TR")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Son Aktiviteler
        </CardTitle>
        <CardDescription>Sistemdeki son değişiklikler</CardDescription>
      </CardHeader>
      <CardContent>
        {recentCompanies.length === 0 && recentFixtures.length === 0 ? (
          <div className="py-8 text-center">
            <div className="rounded-full bg-muted/50 p-3 w-fit mx-auto mb-3">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Henüz aktivite bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-6">
            {recentCompanies.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Son Eklenen Şirketler
                </h4>
                <div className="space-y-2">
                  {recentCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50"
                    >
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(company.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentFixtures.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Son Fixture'lar
                </h4>
                <div className="space-y-2">
                  {recentFixtures.map((fixture) => (
                    <div
                      key={fixture.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50"
                    >
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fixture.charterer}</p>
                        <p className="text-xs text-muted-foreground">
                          {fixture.cargo_type || "Kargo tipi belirtilmemiş"} • {formatDate(fixture.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
