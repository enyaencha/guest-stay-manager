-- Store inventory transaction date with time

ALTER TABLE public.inventory_transactions
  ALTER COLUMN transaction_date TYPE timestamptz USING transaction_date::timestamptz;
