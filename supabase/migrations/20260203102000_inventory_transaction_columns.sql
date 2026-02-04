-- Ensure inventory_transactions has lot/expiry/batch/transaction_date columns

ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS batch_code TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS transaction_date DATE,
  ADD COLUMN IF NOT EXISTS inventory_lot_id UUID;

ALTER TABLE public.inventory_transactions
  DROP CONSTRAINT IF EXISTS inventory_transactions_inventory_lot_id_fkey;

ALTER TABLE public.inventory_transactions
  ADD CONSTRAINT inventory_transactions_inventory_lot_id_fkey
  FOREIGN KEY (inventory_lot_id) REFERENCES public.inventory_lots(id) ON DELETE SET NULL;
