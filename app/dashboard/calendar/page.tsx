"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CalendarView } from "@/components/calendar-view"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default function CalendarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch("/api/auth/me")
        if (!userRes.ok) {
          router.push("/auth/signin")
          return
        }
        const userData = await userRes.json()
        setUser(userData)

        const [fixturesRes, voyagesRes, invoicesRes] = await Promise.all([
          fetch("/api/fixtures"),
          fetch("/api/voyages"),
          fetch("/api/invoices"),
        ])

        let fixtures = []
        let voyages = []
        let invoices = []

        try {
          const fixturesData = await fixturesRes.json()
          fixtures = Array.isArray(fixturesData) ? fixturesData : []
        } catch (error) {
          console.error("[v0] Error parsing fixtures:", error)
          fixtures = []
        }

        try {
          const voyagesData = await voyagesRes.json()
          voyages = Array.isArray(voyagesData) ? voyagesData : []
        } catch (error) {
          console.error("[v0] Error parsing voyages:", error)
          voyages = []
        }

        try {
          const invoicesData = await invoicesRes.json()
          invoices = Array.isArray(invoicesData) ? invoicesData : []
        } catch (error) {
          console.error("[v0] Error parsing invoices:", error)
          invoices = []
        }

        const calendarEvents = []

        for (const fixture of fixtures) {
          if (fixture.laycan_from) {
            calendarEvents.push({
              id: `laycan-from-${fixture.id}`,
              title: `${fixture.fixture_ref} - Laycan Başlangıç`,
              date: new Date(fixture.laycan_from),
              type: "laycan",
              details: fixture,
            })
          }
          if (fixture.laycan_to) {
            calendarEvents.push({
              id: `laycan-to-${fixture.id}`,
              title: `${fixture.fixture_ref} - Laycan Bitiş`,
              date: new Date(fixture.laycan_to),
              type: "laycan",
              details: fixture,
            })
          }
        }

        for (const voyage of voyages) {
          if (voyage.eta_load) {
            calendarEvents.push({
              id: `voyage-eta-${voyage.id}`,
              title: `${voyage.voyage_number} - Yükleme Limanı Varış`,
              date: new Date(voyage.eta_load),
              type: "voyage",
              details: voyage,
            })
          }
          if (voyage.eta_discharge) {
            calendarEvents.push({
              id: `voyage-etd-${voyage.id}`,
              title: `${voyage.voyage_number} - Tahliye Limanı Varış`,
              date: new Date(voyage.eta_discharge),
              type: "voyage",
              details: voyage,
            })
          }
        }

        for (const invoice of invoices) {
          if (invoice.due_date) {
            calendarEvents.push({
              id: `invoice-due-${invoice.id}`,
              title: `Fatura ${invoice.invoice_number} - Vade Tarihi`,
              date: new Date(invoice.due_date),
              type: "invoice",
              details: invoice,
            })
          }
        }

        setEvents(calendarEvents)
      } catch (error) {
        console.error("Error loading calendar data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading || !user) {
    return (
      <DashboardLayout user={user || { name: "", email: "" }}>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Takvim</h1>
          <p className="text-muted-foreground">Laycan tarihleri ve sefer programları</p>
        </div>

        <CalendarView events={events} onEventClick={setSelectedEvent} />

        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tarih</p>
                  <p className="font-medium">{new Date(selectedEvent.date).toLocaleDateString("tr-TR")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tip</p>
                  <Badge>
                    {selectedEvent.type === "laycan" ? "Laycan" : selectedEvent.type === "voyage" ? "Sefer" : "Fatura"}
                  </Badge>
                </div>
                {selectedEvent.details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Detaylar</p>
                    <div className="space-y-1 text-sm">
                      {selectedEvent.type === "laycan" && (
                        <>
                          <p>
                            <span className="font-medium">Fixture Ref:</span> {selectedEvent.details.fixture_ref}
                          </p>
                          <p>
                            <span className="font-medium">Kargo:</span> {selectedEvent.details.cargo_type}
                          </p>
                          <p>
                            <span className="font-medium">Miktar:</span> {selectedEvent.details.cargo_quantity} MT
                          </p>
                        </>
                      )}
                      {selectedEvent.type === "voyage" && (
                        <>
                          <p>
                            <span className="font-medium">Sefer No:</span> {selectedEvent.details.voyage_number}
                          </p>
                          <p>
                            <span className="font-medium">Durum:</span> {selectedEvent.details.status}
                          </p>
                        </>
                      )}
                      {selectedEvent.type === "invoice" && (
                        <>
                          <p>
                            <span className="font-medium">Fatura No:</span> {selectedEvent.details.invoice_number}
                          </p>
                          <p>
                            <span className="font-medium">Tutar:</span> $
                            {selectedEvent.details.amount?.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Durum:</span> {selectedEvent.details.status}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
