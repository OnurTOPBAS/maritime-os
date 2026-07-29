import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download } from "lucide-react"

interface Document {
  id: string
  file_name: string
  file_type: string
  uploaded_at: string
  entity_type: string
  entity_id: string
}

interface RecentDocumentsWidgetProps {
  documents: Document[]
}

export function RecentDocumentsWidget({ documents }: RecentDocumentsWidgetProps) {
  const recentDocs = documents.slice(0, 5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

    if (diffInHours < 1) return "Az önce"
    if (diffInHours < 24) return `${diffInHours} saat önce`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "Dün"
    if (diffInDays < 7) return `${diffInDays} gün önce`
    return date.toLocaleDateString("tr-TR")
  }

  const getEntityLabel = (type: string) => {
    const labels: Record<string, string> = {
      ship: "Gemi",
      fixture: "Fixture",
      invoice: "Fatura",
      voyage: "Sefer",
      company: "Şirket",
    }
    return labels[type] || type
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Son Belgeler
        </CardTitle>
        <CardDescription>En son yüklenen dokümanlar</CardDescription>
      </CardHeader>
      <CardContent>
        {recentDocs.length > 0 ? (
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent transition-colors group"
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getEntityLabel(doc.entity_type)} • {formatDate(doc.uploaded_at)}
                  </p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Henüz belge yüklenmemiş</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
