-- Add opening balance columns to office_bank_balances if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'office_bank_balances' 
                   AND column_name = 'opening_balance_usd') THEN
        ALTER TABLE office_bank_balances ADD COLUMN opening_balance_usd DECIMAL(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'office_bank_balances' 
                   AND column_name = 'opening_balance_tl') THEN
        ALTER TABLE office_bank_balances ADD COLUMN opening_balance_tl DECIMAL(15, 2) DEFAULT 0;
    END IF;
END $$;
