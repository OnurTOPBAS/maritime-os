/**
 * Banka tipi rozeti (SVG). Her tipe sabit renk + kısa ad; kolay ayırt etmek
 * için. İleride gerçek banka logolarını (SVG) buradaki `render` yerine koyarak
 * değiştirebilirsin — tek dosya.
 */

export interface BankTypeMeta {
  value: string
  label: string
  color: string
  short: string
}

/** Seçici ve gruplama için banka tipleri (sıra = gösterim sırası). */
export const BANK_TYPES: BankTypeMeta[] = [
  { value: "isbank", label: "İş Bankası", color: "#0F4C9A", short: "İŞ" },
  { value: "garanti", label: "Garanti BBVA", color: "#00A24B", short: "G" },
  { value: "ziraat", label: "Ziraat Bankası", color: "#E30613", short: "Z" },
  { value: "vakif", label: "Vakıf", color: "#F4A300", short: "V" },
  { value: "yapikredi", label: "Yapı Kredi", color: "#003D7C", short: "YK" },
  { value: "emirates_nbd", label: "Emirates NBD", color: "#00857C", short: "NBD" },
  { value: "cash", label: "Kasa / Nakit", color: "#6B7280", short: "₺" },
  { value: "other", label: "Diğer", color: "#94A3B8", short: "?" },
]

const BY_VALUE: Record<string, BankTypeMeta> = Object.fromEntries(
  BANK_TYPES.map((t) => [t.value, t]),
)

export function bankTypeMeta(type: string | null | undefined): BankTypeMeta {
  return (type && BY_VALUE[type]) || BY_VALUE.other
}

export function bankTypeLabel(type: string | null | undefined): string {
  return bankTypeMeta(type).label
}

export function BankIcon({ type, size = 32 }: { type: string | null | undefined; size?: number }) {
  const s = bankTypeMeta(type)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={s.label}
      className="shrink-0"
    >
      <rect width="40" height="40" rx="9" fill={s.color} />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={s.short.length > 2 ? 11 : 15}
        fontWeight="700"
        fill="#ffffff"
        fontFamily="system-ui, sans-serif"
      >
        {s.short}
      </text>
    </svg>
  )
}
