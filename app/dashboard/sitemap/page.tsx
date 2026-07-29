import { requireAuth } from "@/lib/session"
import {
  Building2,
  Ship,
  FileText,
  BarChart3,
  Settings,
  Anchor,
  Calendar,
  Layers,
  Navigation,
  MessageSquare,
  CheckSquare,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SitemapPage() {
  await requireAuth()

  const sections = [
    {
      title: "Ana Sayfa",
      icon: BarChart3,
      links: [{ title: "Dashboard", href: "/dashboard", description: "Genel bakış ve istatistikler" }],
    },
    {
      title: "Operasyonlar",
      icon: Ship,
      links: [
        { title: "Gemiler", href: "/dashboard/ships", description: "Tüm gemileri görüntüle ve yönet" },
        { title: "Filolar", href: "/dashboard/fleets", description: "Filo yönetimi" },
        { title: "Fixture'lar", href: "/dashboard/fixtures", description: "Fixture kayıtlarını yönet" },
        { title: "Seferler", href: "/dashboard/voyages", description: "Sefer kayıtlarını görüntüle" },
        { title: "Sefer Hesaplama", href: "/dashboard/voyage-calculator", description: "Sefer karlılık hesaplamaları" },
        { title: "Sefer Muhasebe", href: "/dashboard/voyage-account", description: "Sefer muhasebe kayıtları" },
      ],
    },
    {
      title: "Finans",
      icon: FileText,
      links: [
        { title: "Faturalar", href: "/dashboard/invoices", description: "Fatura oluştur ve yönet" },
        {
          title: "Raporlar",
          href: "/dashboard/reports",
          description: "Finansal raporlar, sertifika istatistikleri ve analizler",
        },
        {
          title: "Sertifika Raporları",
          href: "/dashboard/certificates/reports",
          description: "Sertifika durum raporları",
        },
      ],
    },
    {
      title: "İletişim",
      icon: MessageSquare,
      links: [
        { title: "Mesajlar", href: "/dashboard/messages", description: "Dahili mesajlaşma sistemi" },
        { title: "Bildirimler", href: "/dashboard/notifications", description: "Tüm bildirimler" },
      ],
    },
    {
      title: "Görevler",
      icon: CheckSquare,
      links: [{ title: "Görev Yönetimi", href: "/dashboard/tasks", description: "Görevleri görüntüle ve yönet" }],
    },
    {
      title: "Takvim",
      icon: Calendar,
      links: [{ title: "Takvim", href: "/dashboard/calendar", description: "Etkinlikler ve randevular" }],
    },
    {
      title: "Yönetim",
      icon: Settings,
      links: [
        { title: "Kullanıcılar", href: "/dashboard/users", description: "Kullanıcı yönetimi ve roller" },
        { title: "Şirketler", href: "/dashboard/companies", description: "Şirket ve filo yönetimi" },
        {
          title: "Kullanıcı Aktivitesi",
          href: "/dashboard/users/activity",
          description: "Kullanıcı aktivite logları ve istatistikleri",
        },
        { title: "Aktivite Geçmişi", href: "/dashboard/activity", description: "Sistem aktivite geçmişi" },
        {
          title: "Gelişmiş İzinler",
          href: "/dashboard/permissions/advanced",
          description: "Detaylı izin yönetimi",
        },
        { title: "Profil", href: "/dashboard/profile", description: "Kullanıcı profili ve ayarları" },
        { title: "Ayarlar", href: "/dashboard/settings", description: "Sistem ayarları" },
        { title: "Site Haritası", href: "/dashboard/sitemap", description: "Tüm sayfalar" },
      ],
    },
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Site Haritası</h1>
        <p className="text-muted-foreground mt-2">Sistemdeki tüm sayfalara hızlı erişim</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{link.title}</div>
                      <div className="text-sm text-muted-foreground">{link.description}</div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arama Kapsamı</CardTitle>
          <CardDescription>Arama fonksiyonu aşağıdaki alanlarda arama yapar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Building2 className="h-4 w-4" />
                Şirketler
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Şirket adı</li>
                <li>• Email adresi</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Layers className="h-4 w-4" />
                Filolar
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Filo adı</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Ship className="h-4 w-4" />
                Gemiler
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Gemi adı</li>
                <li>• IMO numarası</li>
                <li>• Bayrak</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Anchor className="h-4 w-4" />
                Fixture'lar
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Charterer adı</li>
                <li>• Kargo tipi</li>
                <li>• Yükleme limanı</li>
                <li>• Boşaltma limanı</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Navigation className="h-4 w-4" />
                Seferler
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Sefer numarası</li>
                <li>• Yükleme limanı</li>
                <li>• Boşaltma limanı</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" />
                Faturalar
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Fatura numarası</li>
                <li>• Fatura tipi</li>
                <li>• Durum</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <CheckSquare className="h-4 w-4" />
                Görevler
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Görev başlığı</li>
                <li>• Görev açıklaması</li>
                <li>• Atanan kişi</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
