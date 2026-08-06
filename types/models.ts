/**
 * Paylaşılan alan (domain) tipleri.
 *
 * Aynı kavram birden fazla bileşende ayrı ayrı tanımlandığında TypeScript
 * bunları farklı tipler olarak görür ve aralarında veri aktarımı hata verir
 * (ör. "Two different types with this name exist"). Ortak kavramlar burada
 * tek kez tanımlanır.
 */

export interface FleetBank {
  id: string
  fleet_id: string
  bank_name: string
  bank_code?: string
  swift_code?: string
  branch_name?: string
  branch_address?: string
  relationship_manager_name?: string
  relationship_manager_email?: string
  relationship_manager_phone?: string
  notes?: string
  accounts?: BankAccount[]
}

/** Form gönderimi sırasında kayıt henüz oluşmadığından kimlikler isteğe bağlıdır. */
export type FleetBankInput = Omit<FleetBank, "id" | "fleet_id" | "accounts"> & {
  id?: string
  fleet_id?: string
}

export interface BankAccount {
  id: string
  bank_id?: string
  account_name: string
  account_number: string
  currency: string
  iban?: string
  account_type?: string
  is_active: boolean
  swift_code?: string
  notes?: string
}

export interface Fleet {
  id: string
  name: string
  description?: string | null
  company_id?: string
  created_at?: string
  updated_at?: string
  ship_count?: number
}
