import { sql } from "@/lib/db"

/*
 * Office PnL banka/kasa bakiyesi hesaplamaları (paylaşılan).
 *
 *   Açılış  = o ay elle girilmiş başlangıç varsa o, yoksa önceki ayın kapanışı.
 *   Kapanış = Açılış + o ay o bankadan yapılan ÖDENMİŞ gelir/giderlerin neti.
 *
 * AED yalnızca elle açılış olarak taşınır (giderler TL/USD'dir).
 */

export interface Money { usd: number; tl: number; aed: number }
export const ZERO_MONEY: Money = { usd: 0, tl: 0, aed: 0 }

const n = (v: any) => Number.parseFloat(v) || 0

export function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** (banka, ay) açılışı: elle girilmiş varsa o, yoksa önceki ayın kapanışı. */
export async function computeOpening(bankId: string, month: string, depth = 0): Promise<Money> {
  const [row] = await sql`
    SELECT opening_balance_usd, opening_balance_tl, opening_balance_aed
    FROM office_bank_balances
    WHERE bank_id = ${bankId} AND report_month = ${month}
  `
  if (row) {
    return { usd: n(row.opening_balance_usd), tl: n(row.opening_balance_tl), aed: n(row.opening_balance_aed) }
  }
  if (depth >= 24) return ZERO_MONEY
  return computeClosing(bankId, prevMonth(month), depth + 1)
}

/** (banka, ay) kapanış (kalan) bakiyesi. */
export async function computeClosing(bankId: string, month: string, depth = 0): Promise<Money> {
  const opening = await computeOpening(bankId, month, depth)
  const [net] = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN price_usd ELSE -price_usd END), 0) AS usd,
      COALESCE(SUM(CASE WHEN type = 'income' THEN price_tl  ELSE -price_tl  END), 0) AS tl
    FROM office_pnl
    WHERE payee_bank_id = ${bankId} AND report_month = ${month} AND payment_status = 'paid'
  `
  return { usd: opening.usd + n(net.usd), tl: opening.tl + n(net.tl), aed: opening.aed }
}

/** Tüm bankaların o ay sonundaki kapanış (kalan) toplamı = güncel kasa. */
export async function computeTotalKasa(month: string): Promise<Money> {
  const banks = await sql`
    SELECT DISTINCT b.id
    FROM office_payee_banks b
    WHERE b.id IN (SELECT bank_id FROM office_bank_balances)
       OR b.id IN (
         SELECT payee_bank_id FROM office_pnl
         WHERE payee_bank_id IS NOT NULL AND report_month <= ${month}
       )
  `
  const total: Money = { usd: 0, tl: 0, aed: 0 }
  for (const b of banks) {
    const c = await computeClosing(b.id, month)
    total.usd += c.usd
    total.tl += c.tl
    total.aed += c.aed
  }
  return total
}
