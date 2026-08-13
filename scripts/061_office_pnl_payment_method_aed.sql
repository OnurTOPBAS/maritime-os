-- Office PnL şablon export'u için eksik alanlar:
--  - Ödeme Yöntemi (Payment Method): banka hesabından ayrı (Banka / Nakit / KK).
--  - Tarih Tipi (Date Type): fatura tarihi yerine "Reel / Tahmini / N/A" işareti.
--  - Banka bakiyelerinde AED para birimi (şu ana kadar sadece TL ve USD vardı).

ALTER TABLE office_pnl ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE office_pnl ADD COLUMN IF NOT EXISTS date_type VARCHAR(20);

ALTER TABLE office_bank_balances ADD COLUMN IF NOT EXISTS opening_balance_aed DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE office_bank_balances ADD COLUMN IF NOT EXISTS closing_balance_aed DECIMAL(15, 2) DEFAULT 0;
