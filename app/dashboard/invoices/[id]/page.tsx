import { requireAuth } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { sql } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { DocumentList } from "@/components/document-list"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  const { id } = await params

  const invoices = await sql`
    SELECT 
      i.*,
      c.name as company_name,
      f.charterer as fixture_charterer,
      v.voyage_number,
      s.name as ship_name
    FROM invoices i
    LEFT JOIN companies c ON i.company_id = c.id
    LEFT JOIN company_team_members ctm ON c.id = ctm.company_id AND ctm.user_id = ${user.id}
    LEFT JOIN fixtures f ON i.fixture_id = f.id
    LEFT JOIN voyages v ON i.voyage_id = v.id
    LEFT JOIN ships s ON f.ship_id = s.id
    WHERE i.id = ${id} AND (c.owner_id = ${user.id} OR ctm.user_id IS NOT NULL)
  `

  if (invoices.length === 0) {
    redirect("/dashboard")
  }

  const invoice = invoices[0]

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    }
    const labels: Record<string, string> = {
      paid: "Ödendi",
      pending: "Bekliyor",
      overdue: "Gecikmiş",
    }
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      income: "Gelir",
      expense: "Gider",
    }
    return <Badge variant={type === "income" ? "default" : "secondary"}>{labels[type] || type}</Badge>
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6" />
              Fatura #{invoice.invoice_number}
            </CardTitle>
            <CardDescription>{invoice.company_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fatura Tarihi</p>
                <p>{formatDate(invoice.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vade Tarihi</p>
                <p>{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tutar</p>
                <p className="text-lg font-semibold">
                  {invoice.amount.toLocaleString()} {invoice.currency}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tip</p>
                {getTypeBadge(invoice.type)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durum</p>
                {getStatusBadge(invoice.status)}
              </div>
              {invoice.fixture_charterer && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fixture</p>
                  <p>{invoice.fixture_charterer}</p>
                </div>
              )}
              {invoice.ship_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gemi</p>
                  <p>{invoice.ship_name}</p>
                </div>
              )}
              {invoice.voyage_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sefer</p>
                  <p>{invoice.voyage_number}</p>
                </div>
              )}
            </div>
            {invoice.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-1">Açıklama</p>
                <p className="text-sm">{invoice.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokümanlar</CardTitle>
            <CardDescription>Faturaya ait belgeler ve dosyalar</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentList invoiceId={invoice.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
